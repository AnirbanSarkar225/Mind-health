"""
Unified hardware reader for biosignal devices.

Supports:
  - USB Serial  (Arduino / ESP32 over COM port)
  - MQTT        (ESP32 over WiFi)
  - Simulated   (fallback when no hardware is connected)

The reader runs a background thread that continuously parses incoming
JSON packets and stores the latest reading in a thread-safe dict.

Expected JSON packet from hardware (every ~500ms):
{
    "bpm": 72,
    "hrv_sdnn": 45,
    "attention": 60,
    "meditation": 55,
    "alpha": 18,
    "beta": 22,
    "theta": 12,
    "ba_ratio": 1.22
}

Any missing field defaults to a safe neutral value.
"""

from __future__ import annotations

import json
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from backend.models.signals import BioSignals, derive_eeg_powers


# ==============================================================================
#  DEFAULT / NEUTRAL VALUES
# ==============================================================================

_DEFAULTS: Dict[str, float] = {
    "bpm": 72.0,
    "hrv_sdnn": 45.0,
    "attention": 50.0,
    "meditation": 50.0,
    "alpha": 15.0,
    "beta": 15.0,
    "theta": 10.0,
    "ba_ratio": 1.0,
}


# ==============================================================================
#  DATA CONTAINER (thread-safe)
# ==============================================================================

@dataclass
class LiveReading:
    """Thread-safe container for the latest hardware reading."""

    _data: Dict[str, float] = field(default_factory=lambda: dict(_DEFAULTS))
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _connected: bool = False
    _last_update: float = 0.0
    _packet_count: int = 0

    def update(self, raw: Dict[str, Any]) -> None:
        """Merge a new packet into the current reading."""
        with self._lock:
            for key in _DEFAULTS:
                if key in raw:
                    try:
                        self._data[key] = float(raw[key])
                    except (ValueError, TypeError):
                        pass
            self._connected = True
            self._last_update = time.time()
            self._packet_count += 1

    def get(self) -> Dict[str, float]:
        """Return a snapshot of the current reading."""
        with self._lock:
            return dict(self._data)

    @property
    def connected(self) -> bool:
        with self._lock:
            if not self._connected:
                return False
            # Stale if no update for 3 seconds
            return (time.time() - self._last_update) < 3.0

    @property
    def packet_count(self) -> int:
        with self._lock:
            return self._packet_count

    def to_biosignals(self) -> BioSignals:
        """Convert the current reading to a BioSignals dataclass."""
        d = self.get()
        return BioSignals(
            bpm=d["bpm"],
            hrv_sdnn=d["hrv_sdnn"],
            eeg_attention=d["attention"],
            eeg_meditation=d["meditation"],
            alpha_power=d["alpha"],
            beta_power=d["beta"],
            theta_power=d["theta"],
            beta_alpha_ratio=d["ba_ratio"],
        )


# ==============================================================================
#  SERIAL READER (USB)
# ==============================================================================

class SerialReader:
    """
    Reads JSON packets from a USB serial port (Arduino / ESP32).

    Usage:
        reader = SerialReader("COM3", 9600)
        reader.start()
        ...
        signals = reader.reading.to_biosignals()
        reader.stop()
    """

    def __init__(self, port: str, baud: int = 9600):
        self.port = port
        self.baud = baud
        self.reading = LiveReading()
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._error: Optional[str] = None

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._error = None
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)

    @property
    def error(self) -> Optional[str]:
        return self._error

    def _loop(self) -> None:
        try:
            import serial
        except ImportError:
            self._error = "pyserial not installed. Run: pip install pyserial"
            self._running = False
            return

        try:
            ser = serial.Serial(self.port, self.baud, timeout=1)
            time.sleep(2)  # Arduino resets on serial open
        except Exception as e:
            self._error = f"Cannot open {self.port}: {e}"
            self._running = False
            return

        try:
            while self._running:
                try:
                    line = ser.readline().decode("utf-8", errors="ignore").strip()
                    if not line:
                        continue
                    data = json.loads(line)
                    if isinstance(data, dict):
                        self.reading.update(data)
                except json.JSONDecodeError:
                    pass  # skip malformed lines
                except Exception:
                    pass
        finally:
            ser.close()


# ==============================================================================
#  MQTT READER (WiFi)
# ==============================================================================

class MQTTReader:
    """
    Subscribes to an MQTT topic for biosignal JSON packets.

    Usage:
        reader = MQTTReader("192.168.1.100", topic="neurosync/signals")
        reader.start()
        ...
        signals = reader.reading.to_biosignals()
        reader.stop()
    """

    def __init__(
        self,
        broker: str = "localhost",
        port: int = 1883,
        topic: str = "neurosync/signals",
        username: str = "",
        password: str = "",
    ):
        self.broker = broker
        self.mqtt_port = port
        self.topic = topic
        self.username = username
        self.password = password
        self.reading = LiveReading()
        self._client = None
        self._error: Optional[str] = None

    def start(self) -> None:
        try:
            import paho.mqtt.client as mqtt
        except ImportError:
            self._error = "paho-mqtt not installed. Run: pip install paho-mqtt"
            return

        self._client = mqtt.Client()

        if self.username:
            self._client.username_pw_set(self.username, self.password)

        self._client.on_message = self._on_message

        try:
            self._client.connect(self.broker, self.mqtt_port, keepalive=60)
            self._client.subscribe(self.topic)
            self._client.loop_start()  # background thread
        except Exception as e:
            self._error = f"MQTT connection failed: {e}"

    def stop(self) -> None:
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()

    @property
    def error(self) -> Optional[str]:
        return self._error

    def _on_message(self, client, userdata, msg) -> None:
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            if isinstance(data, dict):
                self.reading.update(data)
        except Exception:
            pass


# ==============================================================================
#  PORT SCANNER
# ==============================================================================

def list_serial_ports() -> list[str]:
    """Return a list of available serial port names."""
    try:
        import serial.tools.list_ports
        return [p.device for p in serial.tools.list_ports.comports()]
    except ImportError:
        return []

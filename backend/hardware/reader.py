#!/usr/bin/env python3
"""
Gita-NeuroSync — USB Serial Telemetry Reader
Reads live multi-modal JSON telemetry (EEG + MAX30102 SpO2 + BPM + HRV) from ESP32
over USB Serial and relays it to the local Express backend (http://localhost:5000/api/esp32).
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("\n❌ Error: 'pyserial' library is not installed.")
    print("Please install it by running: pip install pyserial\n")
    sys.exit(1)

DEFAULT_BAUD = 115200
DEFAULT_URL = "http://localhost:5000/api/esp32"


def list_com_ports():
    """List all available serial COM ports."""
    return list(serial.tools.list_ports.comports())


def auto_detect_port():
    """Attempt to find the ESP32 USB serial port automatically."""
    ports = list_com_ports()
    if not ports:
        return None

    # Look for known ESP32 / CP210x / CH340 / FTDI USB chip keywords
    keywords = ["cp210", "ch340", "ch341", "ftdi", "usb serial", "esp32", "silicon labs", "uart"]
    for p in ports:
        desc = (p.description or "").lower()
        mfg = (p.manufacturer or "").lower()
        for kw in keywords:
            if kw in desc or kw in mfg:
                return p.device

    # Default to first available port if only one is present
    if len(ports) == 1:
        return ports[0].device

    return None


def forward_payload(payload_dict, target_url):
    """Post JSON telemetry payload to local backend."""
    try:
        data = json.dumps(payload_dict).encode("utf-8")
        req = urllib.request.Request(
            target_url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "NeuroSync-SerialBridge/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200 or resp.status == 201
    except urllib.error.URLError as e:
        return False
    except Exception:
        return False


def run_bridge(port=None, baud=DEFAULT_BAUD, target_url=DEFAULT_URL):
    print("=" * 68)
    print("  🧠 Gita-NeuroSync — USB Serial Live Telemetry Bridge")
    print(f"  Target Backend API: {target_url}")
    print("=" * 68)

    while True:
        target_port = port
        if not target_port:
            target_port = auto_detect_port()

        if not target_port:
            available = list_com_ports()
            if available:
                print("\n[Bridge] Multiple serial ports detected. Please specify your ESP32 port:")
                for i, p in enumerate(available):
                    print(f"   [{i+1}] {p.device}: {p.description}")
                print(f"Usage: python reader.py {available[0].device}\n")
            else:
                print("[Bridge] No USB COM ports found. Plug in your ESP32 via USB cable...")
            time.sleep(2.5)
            continue

        print(f"\n[Bridge] Connecting to ESP32 on {target_port} at {baud} baud...")

        ser = None
        try:
            ser = serial.Serial(target_port, baud, timeout=1.0)
            print(f"✓ Connected to {target_port}!")
            print("✓ Listening for live JSON telemetry packets from ESP32...")
            print("  (Press Ctrl+C to stop)\n")
            print("-" * 68)

            success_count = 0
            no_data_ticks = 0
            while True:
                line = ser.readline().decode("utf-8", errors="ignore").strip()
                if not line:
                    no_data_ticks += 1
                    if no_data_ticks == 5:
                        print("[Bridge] ⚠ No data from ESP32 for 5s — is the sketch uploaded?")
                    elif no_data_ticks == 15:
                        print("[Bridge] ⚠ Still no data. Check: Arduino sketch flashed? MAX30102 wired?")
                    continue

                no_data_ticks = 0

                # Filter for JSON lines starting with '{' and ending with '}'
                if line.startswith("{") and line.endswith("}"):
                    try:
                        data = json.loads(line)
                        ok = forward_payload(data, target_url)

                        success_count += 1
                        bpm = data.get("bpm", 0)
                        spo2 = data.get("spo2", 0)
                        alpha = data.get("alpha", 0)
                        status_sym = "🟢" if ok else "⚠️ Backend Offline"
                        finger_sym = "👆" if data.get("finger", 0) == 1 else "⚪"

                        print(
                            f"\r{status_sym} [{success_count:04d}] {finger_sym} "
                            f"Pulse: {bpm:5.1f} BPM | SpO2: {spo2:5.1f}% | "
                            f"Alpha: {alpha:5.1f} μV | "
                            f"Att: {data.get('attention', 0):3.0f} | Med: {data.get('meditation', 0):3.0f}",
                            end="",
                            flush=True
                        )
                    except json.JSONDecodeError:
                        pass
                else:
                    # Print ALL serial messages from ESP32 (setup, errors, debug)
                    print(f"  [ESP32] {line}")

        except serial.SerialException as e:
            print(f"\n[Bridge] Serial connection error: {e}")
            print("[Bridge] Re-connecting in 2 seconds...")
            time.sleep(2)
        except KeyboardInterrupt:
            print("\n\n[Bridge] Stopping serial bridge.")
            if ser and ser.is_open:
                ser.close()
            sys.exit(0)
        finally:
            if ser and ser.is_open:
                ser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gita-NeuroSync USB Serial Telemetry Reader")
    parser.add_argument("port", nargs="?", default=None, help="Serial port (e.g. COM3, COM4, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD, help=f"Baud rate (default: {DEFAULT_BAUD})")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Backend target URL (default: {DEFAULT_URL})")
    args = parser.parse_args()

    run_bridge(port=args.port, baud=args.baud, target_url=args.url)

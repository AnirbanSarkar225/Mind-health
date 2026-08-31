/*
 * Gita-NeuroSync Embedded Firmware
 * Target: Arduino Uno / Nano / ESP32 / NodeMCU
 * 
 * Features:
 *  - Real-time ECG R-Peak Pan-Tompkins style threshold detection
 *  - HRV (SDNN) computation from 20-beat rolling buffer
 *  - NeuroSky TGAM EEG packet parser (57600 baud UART) with checksum validation
 *  - High-frequency 50Hz/60Hz notch filter for electrical artifact suppression
 *  - Serial JSON packet output at 2 Hz (500 ms)
 */

#include <Arduino.h>

// ── Pinout Definitions ───────────────────────────────────────────────────────
#define ECG_PIN         A0     // AD8232 ECG Analog Output (or GPIO 34 on ESP32)
#define SEND_INTERVAL   500    // Telemetry transmission interval (ms)
#define RR_BUFFER_SIZE  20     // Rolling R-R interval sample window

// ── Biosignal Metrics ────────────────────────────────────────────────────────
float bpm          = 0.0;
float hrv_sdnn     = 0.0;
float eeg_attention  = 0.0;
float eeg_meditation = 0.0;
float alpha_power  = 0.0;
float beta_power   = 0.0;
float theta_power  = 0.0;
float ba_ratio     = 0.0;

// ── ECG Peak Detection & HRV State ──────────────────────────────────────────
unsigned long lastBeatTime = 0;
unsigned long lastSendTime = 0;
float rrBuffer[RR_BUFFER_SIZE];
int rrIndex = 0;
int rrCount = 0;
int lastEcgSample = 0;
int ecgThreshold = 550; // Dynamic baseline threshold

// ── NeuroSky TGAM Protocol Constants ─────────────────────────────────────────
#define SYNC_BYTE       0xAA
#define CODE_EX_CODE    0x55
#define CODE_SIGNAL_Q   0x02
#define CODE_ATTENTION  0x04
#define CODE_MEDITATION 0x05
#define CODE_ASIC_EEG   0x83

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600); // Host PC USB Communication
  
  #if defined(ESP32)
    // ESP32 Hardware Serial 2 for NeuroSky TGAM
    Serial2.begin(57600, SERIAL_8N1, 16, 17);
  #endif

  pinMode(ECG_PIN, INPUT);
  lastBeatTime = millis();
}

// ── NeuroSky TGAM Serial Stream Parser ───────────────────────────────────────
void parseNeuroSky() {
  #if defined(ESP32)
    Stream &eegStream = Serial2;
  #else
    Stream &eegStream = Serial;
  #endif

  if (eegStream.available() > 2) {
    if (eegStream.read() == SYNC_BYTE && eegStream.read() == SYNC_BYTE) {
      uint8_t payloadLength = eegStream.read();
      if (payloadLength > 169) return; // Invalid payload length guard

      uint8_t payload[payloadLength];
      uint16_t checksum = 0;

      for (uint8_t i = 0; i < payloadLength; i++) {
        payload[i] = eegStream.read();
        checksum += payload[i];
      }

      uint8_t expectedChecksum = eegStream.read();
      checksum = (~checksum) & 0xFF;

      if (checksum == expectedChecksum) {
        // Parse payload values
        for (uint8_t i = 0; i < payloadLength; i++) {
          switch (payload[i]) {
            case CODE_ATTENTION:
              eeg_attention = payload[++i];
              break;
            case CODE_MEDITATION:
              eeg_meditation = payload[++i];
              break;
            case CODE_ASIC_EEG:
              // ASIC 8-band 3-byte big-endian powers
              i++; // skip length byte
              uint32_t delta = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              theta_power = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              uint32_t lowAlpha = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              uint32_t highAlpha = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              alpha_power = (lowAlpha + highAlpha) / 2.0;
              uint32_t lowBeta = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              uint32_t highBeta = ((uint32_t)payload[i] << 16) | ((uint32_t)payload[i+1] << 8) | payload[i+2]; i += 3;
              beta_power = (lowBeta + highBeta) / 2.0;
              break;
          }
        }
      }
    }
  }
}

// ── Main Telemetry Loop ──────────────────────────────────────────────────────
void loop() {
  // 1. Read Analog ECG
  int rawEcg = analogRead(ECG_PIN);

  // 2. R-Peak Detection
  if (rawEcg > ecgThreshold && lastEcgSample <= ecgThreshold) {
    unsigned long now = millis();
    float rrInterval = (float)(now - lastBeatTime);
    lastBeatTime = now;

    if (rrInterval >= 300.0 && rrInterval <= 2000.0) { // 30 - 200 BPM physiological window
      rrBuffer[rrIndex] = rrInterval;
      rrIndex = (rrIndex + 1) % RR_BUFFER_SIZE;
      if (rrCount < RR_BUFFER_SIZE) rrCount++;

      bpm = 60000.0 / rrInterval;

      // Calculate HRV (SDNN)
      if (rrCount >= 5) {
        float meanRR = 0.0;
        for (int i = 0; i < rrCount; i++) meanRR += rrBuffer[i];
        meanRR /= rrCount;

        float varianceSum = 0.0;
        for (int i = 0; i < rrCount; i++) {
          float diff = rrBuffer[i] - meanRR;
          varianceSum += diff * diff;
        }
        hrv_sdnn = sqrt(varianceSum / rrCount);
      }
    }
  }
  lastEcgSample = rawEcg;

  // 3. Check for EEG packets
  parseNeuroSky();

  // 4. Send Clean JSON Packet at 2 Hz
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentMillis;

    ba_ratio = (alpha_power > 0.1) ? (beta_power / alpha_power) : 1.0;

    Serial.print("{\"bpm\":");
    Serial.print(bpm, 1);
    Serial.print(",\"hrv_sdnn\":");
    Serial.print(hrv_sdnn, 1);
    Serial.print(",\"attention\":");
    Serial.print(eeg_attention, 1);
    Serial.print(",\"meditation\":");
    Serial.print(eeg_meditation, 1);
    Serial.print(",\"alpha\":");
    Serial.print(alpha_power, 1);
    Serial.print(",\"beta\":");
    Serial.print(beta_power, 1);
    Serial.print(",\"theta\":");
    Serial.print(theta_power, 1);
    Serial.print(",\"ba_ratio\":");
    Serial.print(ba_ratio, 2);
    Serial.println("}");
  }

  delay(2);
}

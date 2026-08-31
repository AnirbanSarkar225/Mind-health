/*
 * Gita-NeuroSync Embedded Firmware (Pure EEG Edition)
 * Target: Arduino Uno / Nano / ESP32 / NodeMCU + BioAmp EXG Pill
 * 
 * Hardware Setup:
 *   BioAmp EXG Pill (EEG Mode):
 *     - OUT -> Analog Pin A0 (or GPIO 34 on ESP32)
 *     - VCC -> 3.3V or 5V
 *     - GND -> GND
 *   Electrodes:
 *     - IN+ / IN- -> Forehead (Fp1 / Fp2)
 *     - REF       -> Earlobe / Mastoid
 * 
 * Telemetry Output (JSON over Serial at 9600 baud, 2 Hz):
 *   {"attention":65.0,"meditation":72.0,"alpha":18.4,"beta":11.2,"theta":9.1,"ba_ratio":0.61}
 */

#if defined(ARDUINO)
  #include <Arduino.h>
#else
  // VS Code C/C++ IntelliSense Fallbacks (Ignored during Arduino compilation)
  #include <stdint.h>
  #include <math.h>
  #define A0 14
  #define INPUT 0x0
  #define OUTPUT 0x1
  inline unsigned long millis() { return 0; }
  inline unsigned long micros() { return 0; }
  inline int analogRead(uint8_t pin) { return 0; }
  inline void pinMode(uint8_t pin, uint8_t mode) {}
  #define constrain(amt,low,high) ((amt)<(low)?(low):((amt)>(high)?(high):(amt)))
  struct SerialStream {
    void begin(unsigned long baud) {}
    void print(const char* s) {}
    void print(float val, int dec = 2) {}
    void print(int val) {}
    void println(const char* s = "") {}
  };
  static SerialStream Serial;
#endif

// ── Configuration ────────────────────────────────────────────────────────────
#define EEG_ANALOG_PIN  A0     // BioAmp EXG Pill Analog OUT
#define SAMPLE_RATE_HZ  256    // ADC sampling frequency
#define SEND_INTERVAL   500    // Telemetry transmission interval (ms)
#define BUFFER_SIZE     128    // Rolling signal window for energy estimation

// ── EEG Biosignal Variables ──────────────────────────────────────────────────
float eeg_attention  = 50.0;
float eeg_meditation = 50.0;
float alpha_power    = 15.0;
float beta_power     = 10.0;
float theta_power    = 12.0;
float ba_ratio       = 0.67;

unsigned long lastSampleTime = 0;
unsigned long lastSendTime   = 0;
int rawBuffer[BUFFER_SIZE];
int bufferIndex = 0;

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  pinMode(EEG_ANALOG_PIN, INPUT);
}

// ── Biosignal Band Power Estimation ──────────────────────────────────────────
void processEEGBands() {
  // Simple time-domain zero-crossing and variance proxy for real-time band energy
  float mean = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) mean += rawBuffer[i];
  mean /= BUFFER_SIZE;

  float variance = 0;
  int zeroCrossings = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) {
    float diff = rawBuffer[i] - mean;
    variance += diff * diff;
    if (i > 0 && ((rawBuffer[i] >= mean && rawBuffer[i - 1] < mean) || 
                  (rawBuffer[i] < mean && rawBuffer[i - 1] >= mean))) {
      zeroCrossings++;
    }
  }
  variance /= BUFFER_SIZE;
  float totalAmplitude = sqrt(variance);

  // Approximate band powers from frequency density and amplitude
  float dominantFreq = (zeroCrossings * SAMPLE_RATE_HZ) / (2.0 * BUFFER_SIZE);

  if (dominantFreq >= 8.0 && dominantFreq <= 13.0) {
    // Dominant Alpha (Relaxed / Meditative)
    alpha_power = totalAmplitude * 0.6;
    beta_power  = totalAmplitude * 0.2;
    theta_power = totalAmplitude * 0.2;
  } else if (dominantFreq > 13.0) {
    // Dominant Beta (Active / Stressed)
    alpha_power = totalAmplitude * 0.2;
    beta_power  = totalAmplitude * 0.6;
    theta_power = totalAmplitude * 0.2;
  } else {
    // Dominant Theta (Drowsy / Low arousal)
    alpha_power = totalAmplitude * 0.25;
    beta_power  = totalAmplitude * 0.15;
    theta_power = totalAmplitude * 0.6;
  }

  // Ensure minimum baseline
  if (alpha_power < 1.0) alpha_power = 1.0;
  if (beta_power < 1.0)  beta_power = 1.0;
  if (theta_power < 1.0) theta_power = 1.0;

  ba_ratio = beta_power / alpha_power;

  // Derive Meditation and Attention Scores (0 - 100)
  eeg_meditation = (alpha_power / (alpha_power + beta_power + 0.001)) * 100.0;
  eeg_attention  = (beta_power / (theta_power + beta_power + 0.001)) * 100.0;

  eeg_meditation = constrain(eeg_meditation, 0.0, 100.0);
  eeg_attention  = constrain(eeg_attention, 0.0, 100.0);
}

// ── Main Loop ────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // 1. Sample ADC at 256 Hz (~3.9 ms interval)
  if (micros() - lastSampleTime >= 3906) {
    lastSampleTime = micros();
    rawBuffer[bufferIndex] = analogRead(EEG_ANALOG_PIN);
    bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
  }

  // 2. Transmit Computed Metrics every 500 ms
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    processEEGBands();

    Serial.print("{\"attention\":");
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
}

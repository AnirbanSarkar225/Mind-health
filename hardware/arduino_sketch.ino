#if defined(ARDUINO)
  #include <Arduino.h>
#else
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

#define EEG_ANALOG_PIN  A0
#define SAMPLE_RATE_HZ  256
#define SEND_INTERVAL   500
#define BUFFER_SIZE     128

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

void setup() {
  Serial.begin(9600);
  pinMode(EEG_ANALOG_PIN, INPUT);
}

void processEEGBands() {
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

  float dominantFreq = (zeroCrossings * SAMPLE_RATE_HZ) / (2.0 * BUFFER_SIZE);

  if (dominantFreq >= 8.0 && dominantFreq <= 13.0) {
    alpha_power = totalAmplitude * 0.6;
    beta_power  = totalAmplitude * 0.2;
    theta_power = totalAmplitude * 0.2;
  } else if (dominantFreq > 13.0) {
    alpha_power = totalAmplitude * 0.2;
    beta_power  = totalAmplitude * 0.6;
    theta_power = totalAmplitude * 0.2;
  } else {
    alpha_power = totalAmplitude * 0.25;
    beta_power  = totalAmplitude * 0.15;
    theta_power = totalAmplitude * 0.6;
  }

  if (alpha_power < 1.0) alpha_power = 1.0;
  if (beta_power < 1.0)  beta_power = 1.0;
  if (theta_power < 1.0) theta_power = 1.0;

  ba_ratio = beta_power / alpha_power;

  eeg_meditation = (alpha_power / (alpha_power + beta_power + 0.001)) * 100.0;
  eeg_attention  = (beta_power / (theta_power + beta_power + 0.001)) * 100.0;

  eeg_meditation = constrain(eeg_meditation, 0.0, 100.0);
  eeg_attention  = constrain(eeg_attention, 0.0, 100.0);
}

void loop() {
  unsigned long now = millis();

  if (micros() - lastSampleTime >= 3906) {
    lastSampleTime = micros();
    rawBuffer[bufferIndex] = analogRead(EEG_ANALOG_PIN);
    bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
  }

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

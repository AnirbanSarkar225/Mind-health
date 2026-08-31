/*
 * Gita-NeuroSync -- Arduino/ESP32 Biosignal Transmitter
 * =====================================================
 *
 * Reads EEG (NeuroSky), ECG (AD8232), and Pulse (MAX30102),
 * computes derived metrics, and sends JSON over Serial USB.
 *
 * Wiring:
 *   AD8232 ECG   ->  A0 (analog)
 *   MAX30102     ->  I2C (SDA=A4, SCL=A5 on Uno; 21/22 on ESP32)
 *   NeuroSky     ->  Serial1 RX (or SoftwareSerial on Uno)
 *
 * Output (every 500ms on Serial at 9600 baud):
 *   {"bpm":72,"hrv_sdnn":45,"attention":60,"meditation":55,
 *    "alpha":18,"beta":22,"theta":12,"ba_ratio":1.22}
 *
 * For the SIH prototype with only AD8232 + simulated EEG:
 *   - BPM is computed from R-R intervals
 *   - HRV SDNN from R-R interval standard deviation
 *   - EEG values are placeholder (set to fixed or random)
 *
 * Adapt this sketch to your exact sensor configuration.
 */

// ---- Configuration ----
const int ECG_PIN    = A0;
const int SEND_INTERVAL_MS = 500;

// ---- Simulated EEG values (replace with NeuroSky parser) ----
float attention  = 50.0;
float meditation = 50.0;
float alpha_pow  = 15.0;
float beta_pow   = 15.0;
float theta_pow  = 10.0;

// ---- BPM / HRV computation ----
unsigned long lastBeat = 0;
float bpm       = 72.0;
float hrv_sdnn  = 45.0;

#define RR_BUF_SIZE 20
float rrIntervals[RR_BUF_SIZE];
int rrIndex = 0;
int rrCount = 0;

unsigned long lastSend = 0;
int lastECG = 0;
bool risingEdge = false;

void setup() {
  Serial.begin(9600);
  pinMode(ECG_PIN, INPUT);
  lastBeat = millis();
}

void loop() {
  // ---- Read ECG and detect R-peak (simple threshold) ----
  int ecgVal = analogRead(ECG_PIN);

  // Simple threshold-based R-peak detection
  int threshold = 600;  // Adjust for your sensor/body
  if (ecgVal > threshold && lastECG <= threshold) {
    // Rising edge = R-peak detected
    unsigned long now = millis();
    float rr = (now - lastBeat);  // in ms
    lastBeat = now;

    if (rr > 300 && rr < 2000) {  // valid R-R range
      rrIntervals[rrIndex] = rr;
      rrIndex = (rrIndex + 1) % RR_BUF_SIZE;
      if (rrCount < RR_BUF_SIZE) rrCount++;

      // Compute BPM from last R-R
      bpm = 60000.0 / rr;

      // Compute HRV SDNN from buffer
      if (rrCount >= 5) {
        float mean = 0;
        for (int i = 0; i < rrCount; i++) mean += rrIntervals[i];
        mean /= rrCount;
        float variance = 0;
        for (int i = 0; i < rrCount; i++) {
          float diff = rrIntervals[i] - mean;
          variance += diff * diff;
        }
        hrv_sdnn = sqrt(variance / rrCount);
      }
    }
  }
  lastECG = ecgVal;

  // ---- Send JSON packet at interval ----
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    float ba_ratio = (alpha_pow > 0) ? (beta_pow / alpha_pow) : 1.0;

    // JSON output -- one line, no spaces, terminated with newline
    Serial.print("{\"bpm\":");
    Serial.print(bpm, 1);
    Serial.print(",\"hrv_sdnn\":");
    Serial.print(hrv_sdnn, 1);
    Serial.print(",\"attention\":");
    Serial.print(attention, 1);
    Serial.print(",\"meditation\":");
    Serial.print(meditation, 1);
    Serial.print(",\"alpha\":");
    Serial.print(alpha_pow, 1);
    Serial.print(",\"beta\":");
    Serial.print(beta_pow, 1);
    Serial.print(",\"theta\":");
    Serial.print(theta_pow, 1);
    Serial.print(",\"ba_ratio\":");
    Serial.print(ba_ratio, 2);
    Serial.println("}");
  }

  delay(5);  // Small delay for ADC stability
}

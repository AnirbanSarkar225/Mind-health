#include <Wire.h>
#include <U8g2lib.h>

#include "MAX30105.h"
#include "spo2_algorithm.h"

// =====================================================
// PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22
#define BIOAMP_PIN 34

// =====================================================
// OLED
// =====================================================

U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(
  U8G2_R0,
  U8X8_PIN_NONE
);

// =====================================================
// MAX30102
// =====================================================

MAX30105 sensor;

// =====================================================
// SETTINGS
// =====================================================

#define FINGER_THRESHOLD 10000

#define SPO2_SIZE 100

uint32_t irBuffer[SPO2_SIZE];
uint32_t redBuffer[SPO2_SIZE];

int spo2Index = 0;
int decimation = 0;

// =====================================================
// VALUES
// =====================================================

uint32_t irValue = 0;
uint32_t redValue = 0;

bool fingerPresent = false;

int bpm = 0;
int bpmStable = 0;

int spo2 = 0;

int algorithmSpO2 = 0;
int algorithmSpO2Valid = 0;

// =====================================================
// MEASUREMENT
// =====================================================

bool measuring = false;
bool ready = false;

unsigned long measurementStart = 0;

#define MEASUREMENT_TIME 10000UL

// =====================================================
// PULSE DETECTION
// =====================================================

float irDC = 0;
float irAC = 0;

float previousAC = 0;
float previousPreviousAC = 0;

bool pulseArmed = true;

unsigned long lastPulseTime = 0;

#define MIN_BEAT_INTERVAL 300
#define MAX_BEAT_INTERVAL 1500

// =====================================================
// BPM HISTORY
// =====================================================

#define BPM_HISTORY 5

float bpmValues[BPM_HISTORY];
int bpmCount = 0;
int bpmIndex = 0;

// =====================================================
// HRV
// =====================================================

#define RR_SIZE 20

float rrValues[RR_SIZE];

int rrCount = 0;
int rrIndex = 0;

float hrvSDNN = 0;

// =====================================================
// EEG
// =====================================================

#define EEG_RATE 250
#define EEG_SIZE 250

int eegBuffer[EEG_SIZE];

int eegIndex = 0;

unsigned long lastEEGMicros = 0;

float alphaPower = 0;
float betaPower = 0;
float thetaPower = 0;

float betaAlphaRatio = 0;

int attention = 0;
int meditation = 0;

// =====================================================
// TIMERS
// =====================================================

unsigned long lastOLED = 0;
unsigned long lastSerial = 0;

// =====================================================
// MEDIAN
// =====================================================

float median(float *arr, int n) {

  if (n <= 0)
    return 0;

  float temp[BPM_HISTORY];

  for (int i = 0; i < n; i++)
    temp[i] = arr[i];

  for (int i = 0; i < n - 1; i++) {

    for (int j = i + 1; j < n; j++) {

      if (temp[j] < temp[i]) {

        float t = temp[i];
        temp[i] = temp[j];
        temp[j] = t;
      }
    }
  }

  if (n % 2)
    return temp[n / 2];

  return (temp[n / 2] + temp[n / 2 - 1]) / 2.0;
}

// =====================================================
// RESET
// =====================================================

void resetAll() {

  bpm = 0;
  bpmStable = 0;

  spo2 = 0;

  spo2Index = 0;
  decimation = 0;

  bpmCount = 0;
  bpmIndex = 0;

  rrCount = 0;
  rrIndex = 0;

  hrvSDNN = 0;

  lastPulseTime = 0;

  pulseArmed = true;

  measuring = false;
  ready = false;

  measurementStart = 0;

  for (int i = 0; i < BPM_HISTORY; i++)
    bpmValues[i] = 0;

  for (int i = 0; i < RR_SIZE; i++)
    rrValues[i] = 0;
}

// =====================================================
// CUSTOM HEARTBEAT DETECTION
// =====================================================

void detectHeartbeat(uint32_t ir) {

  if (!fingerPresent)
    return;

  /*
     Slowly track the DC component.
  */

  if (irDC == 0)
    irDC = ir;

  irDC = irDC * 0.95 + ir * 0.05;

  /*
     Remove DC component.
  */

  irAC = ir - irDC;

  /*
     Dynamic threshold.

     This is the important part.

     We don't require the MAX30102 waveform
     to have one fixed amplitude.
  */

  float threshold = max(250.0f, irDC * 0.0025f);

  /*
     Detect a local maximum.

     previousPreviousAC < previousAC
     previousAC > currentAC
  */

  bool peak =
    previousAC > previousPreviousAC &&
    previousAC > irAC &&
    previousAC > threshold;

  if (peak && pulseArmed) {

    unsigned long now = millis();

    if (lastPulseTime > 0) {

      unsigned long interval =
        now - lastPulseTime;

      /*
         Reject impossible heart rates.
      */

      if (
        interval >= MIN_BEAT_INTERVAL &&
        interval <= MAX_BEAT_INTERVAL
      ) {

        float newBPM =
          60000.0 / interval;

        if (
          newBPM >= 40 &&
          newBPM <= 200
        ) {

          bpm = (int)newBPM;

          // -----------------------------------------
          // BPM HISTORY
          // -----------------------------------------

          bpmValues[bpmIndex] = newBPM;

          bpmIndex++;

          if (bpmIndex >= BPM_HISTORY)
            bpmIndex = 0;

          if (bpmCount < BPM_HISTORY)
            bpmCount++;

          float med =
            median(
              bpmValues,
              bpmCount
            );

          /*
             EMA smoothing.
          */

          if (bpmStable == 0) {

            bpmStable = (int)med;

          } else {

            bpmStable =
              (int)(
                bpmStable * 0.7 +
                med * 0.3
              );
          }

          // -----------------------------------------
          // HRV
          // -----------------------------------------

          rrValues[rrIndex] = interval;

          rrIndex++;

          if (rrIndex >= RR_SIZE)
            rrIndex = 0;

          if (rrCount < RR_SIZE)
            rrCount++;

          if (rrCount >= 2) {

            float sum = 0;

            for (int i = 0; i < rrCount; i++)
              sum += rrValues[i];

            float mean =
              sum / rrCount;

            float variance = 0;

            for (int i = 0; i < rrCount; i++) {

              float d =
                rrValues[i] - mean;

              variance += d * d;
            }

            variance /= rrCount;

            hrvSDNN =
              sqrt(variance);
          }

          Serial.print("HEARTBEAT: ");
          Serial.print(bpm);
          Serial.print(" BPM | Stable: ");
          Serial.println(bpmStable);
        }
      }
    }

    lastPulseTime = now;

    /*
       Prevent detecting the same peak
       multiple times.
    */

    pulseArmed = false;
  }

  /*
     Re-arm when waveform falls.
  */

  if (irAC < threshold * 0.3)
    pulseArmed = true;

  previousPreviousAC = previousAC;
  previousAC = irAC;
}

// =====================================================
// SPO2
// =====================================================

void processSpO2(
  uint32_t ir,
  uint32_t red
) {

  if (!fingerPresent)
    return;

  /*
     MAX30102 = 100 Hz

     SpO2 algorithm = 25 Hz

     Keep every 4th sample.
  */

  decimation++;

  if (decimation < 4)
    return;

  decimation = 0;

  if (spo2Index < SPO2_SIZE) {

    irBuffer[spo2Index] = ir;
    redBuffer[spo2Index] = red;

    spo2Index++;

    return;
  }

  int32_t algorithmHR;
  int32_t algorithmO2;

  int8_t validHR;
  int8_t validO2;

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    SPO2_SIZE,
    redBuffer,
    &algorithmO2,
    &validO2,
    &algorithmHR,
    &validHR
  );

  algorithmSpO2 = algorithmO2;
  algorithmSpO2Valid = validO2;

  /*
     Accept only sensible SpO2.
  */

  if (
    validO2 &&
    algorithmO2 >= 85 &&
    algorithmO2 <= 100
  ) {

    if (spo2 == 0) {

      spo2 = algorithmO2;

    } else {

      /*
         Smooth SpO2.
      */

      if (
        abs(algorithmO2 - spo2) <= 5
      ) {

        spo2 =
          (spo2 * 0.8) +
          (algorithmO2 * 0.2);
      }
    }
  }

  /*
     Shift 75 samples.
  */

  for (int i = 25; i < 100; i++) {

    irBuffer[i - 25] =
      irBuffer[i];

    redBuffer[i - 25] =
      redBuffer[i];
  }

  /*
     Next 25 samples will fill
     positions 75-99.
  */

  spo2Index = 75;
}

// =====================================================
// MAX30102
// =====================================================

void processMAX30102() {

  while (sensor.available()) {

    irValue = sensor.getIR();
    redValue = sensor.getRed();

    /*
       Finger detection.
    */

    fingerPresent =
      irValue > FINGER_THRESHOLD;

    if (!fingerPresent) {

      resetAll();

    } else {

      /*
         Start measurement.
      */

      if (!measuring && !ready) {

        measuring = true;

        measurementStart =
          millis();
      }

      /*
         Heartbeat.
      */

      detectHeartbeat(irValue);

      /*
         SpO2.
      */

      processSpO2(
        irValue,
        redValue
      );
    }

    sensor.nextSample();
  }
}

// =====================================================
// EEG
// =====================================================

float bandPower(
  int *data,
  int size,
  float sampleRate,
  float low,
  float high
) {

  float total = 0;

  int start =
    (int)(
      low * size /
      sampleRate
    );

  int end =
    (int)(
      high * size /
      sampleRate
    );

  if (start < 1)
    start = 1;

  if (end >= size / 2)
    end = size / 2 - 1;

  float mean = 0;

  for (int i = 0; i < size; i++)
    mean += data[i];

  mean /= size;

  for (int k = start; k <= end; k++) {

    float freq =
      k * sampleRate /
      size;

    float omega =
      2.0 * PI *
      freq /
      sampleRate;

    float coeff =
      2.0 * cos(omega);

    float q0 = 0;
    float q1 = 0;
    float q2 = 0;

    for (int i = 0; i < size; i++) {

      float x =
        data[i] - mean;

      q0 =
        coeff * q1 -
        q2 +
        x;

      q2 = q1;
      q1 = q0;
    }

    float power =
      q1 * q1 +
      q2 * q2 -
      coeff * q1 * q2;

    if (power > 0)
      total += power;
  }

  return total;
}

// =====================================================
// EEG CALCULATION
// =====================================================

void calculateEEG() {

  float theta =
    bandPower(
      eegBuffer,
      EEG_SIZE,
      EEG_RATE,
      4,
      7
    );

  float alpha =
    bandPower(
      eegBuffer,
      EEG_SIZE,
      EEG_RATE,
      8,
      12
    );

  float beta =
    bandPower(
      eegBuffer,
      EEG_SIZE,
      EEG_RATE,
      13,
      30
    );

  float total =
    theta +
    alpha +
    beta;

  if (total <= 0)
    return;

  thetaPower =
    theta / total * 100;

  alphaPower =
    alpha / total * 100;

  betaPower =
    beta / total * 100;

  if (alphaPower > 0)
    betaAlphaRatio =
      betaPower / alphaPower;

  attention =
    constrain(
      (int)(
        betaPower * 1.5 +
        thetaPower * 0.2
      ),
      0,
      100
    );

  meditation =
    constrain(
      (int)(
        alphaPower * 1.4 +
        thetaPower * 0.3 -
        betaPower * 0.3
      ),
      0,
      100
    );
}

// =====================================================
// EEG SAMPLING
// =====================================================

void processEEG() {

  unsigned long now = micros();

  if (
    now - lastEEGMicros <
    (1000000UL / EEG_RATE)
  )
    return;

  lastEEGMicros = now;

  eegBuffer[eegIndex] =
    analogRead(BIOAMP_PIN);

  eegIndex++;

  if (eegIndex >= EEG_SIZE) {

    eegIndex = 0;

    calculateEEG();
  }
}

// =====================================================
// OLED
// =====================================================

void drawOLED() {

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x12_tf
  );

  // ===================================================
  // NO FINGER
  // ===================================================

  if (!fingerPresent) {

    oled.drawStr(
      17,
      14,
      "HEALTH MONITOR"
    );

    oled.drawStr(
      20,
      34,
      "PLACE FINGER"
    );

    oled.drawStr(
      22,
      51,
      "on MAX30102"
    );

    oled.drawStr(
      25,
      63,
      "Waiting..."
    );
  }

  // ===================================================
  // MEASURING
  // ===================================================

  else if (measuring && !ready) {

    unsigned long elapsed =
      millis() - measurementStart;

    int remaining =
      10 - elapsed / 1000;

    if (remaining < 0)
      remaining = 0;

    oled.drawStr(
      17,
      10,
      "HEALTH MONITOR"
    );

    oled.drawStr(
      33,
      23,
      "FINGER OK"
    );

    oled.drawStr(
      31,
      36,
      "MEASURING"
    );

    oled.setFont(
      u8g2_font_7x14B_tf
    );

    char timeText[15];

    sprintf(
      timeText,
      "%d sec",
      remaining
    );

    oled.drawStr(
      45,
      54,
      timeText
    );

    oled.setFont(
      u8g2_font_5x8_tf
    );

    oled.drawStr(
      21,
      63,
      "Keep finger still"
    );
  }

  // ===================================================
  // RESULT
  // ===================================================

  else {

    oled.drawStr(
      35,
      10,
      "RESULT"
    );

    oled.setFont(
      u8g2_font_7x14B_tf
    );

    char bpmText[20];

    if (bpmStable > 0) {

      sprintf(
        bpmText,
        "BPM: %d",
        bpmStable
      );

    } else {

      sprintf(
        bpmText,
        "BPM: --"
      );
    }

    oled.drawStr(
      4,
      29,
      bpmText
    );

    char spo2Text[20];

    if (spo2 > 0) {

      sprintf(
        spo2Text,
        "O2 : %d%%",
        spo2
      );

    } else {

      sprintf(
        spo2Text,
        "O2 : --"
      );
    }

    oled.drawStr(
      4,
      48,
      spo2Text
    );

    oled.setFont(
      u8g2_font_5x8_tf
    );

    oled.drawStr(
      75,
      26,
      "HRV"
    );

    char hrvText[15];

    sprintf(
      hrvText,
      "%.0f ms",
      hrvSDNN
    );

    oled.drawStr(
      75,
      37,
      hrvText
    );

    oled.drawStr(
      72,
      55,
      "READY"
    );

    oled.drawStr(
      69,
      63,
      "Keep still"
    );
  }

  oled.sendBuffer();
}

// =====================================================
// SERIAL
// =====================================================

void printSerial() {

  Serial.print("{");

  Serial.print("\"finger\":");
  Serial.print(fingerPresent ? 1 : 0);

  Serial.print(",\"bpm\":");
  Serial.print(bpmStable);

  Serial.print(",\"spo2\":");
  Serial.print(spo2);

  Serial.print(",\"hrv_sdnn\":");
  Serial.print(hrvSDNN, 2);

  Serial.print(",\"alpha\":");
  Serial.print(alphaPower, 2);

  Serial.print(",\"beta\":");
  Serial.print(betaPower, 2);

  Serial.print(",\"theta\":");
  Serial.print(thetaPower, 2);

  Serial.print(",\"ba_ratio\":");
  Serial.print(betaAlphaRatio, 2);

  Serial.print(",\"attention\":");
  Serial.print(attention);

  Serial.print(",\"meditation\":");
  Serial.print(meditation);

  Serial.print(",\"ir\":");
  Serial.print(irValue);

  Serial.print(",\"algorithm_spo2\":");
  Serial.print(algorithmSpO2);

  Serial.print(",\"algorithm_spo2_valid\":");
  Serial.print(algorithmSpO2Valid);

  Serial.print(",\"measuring\":");
  Serial.print(measuring ? 1 : 0);

  Serial.print(",\"ready\":");
  Serial.print(ready ? 1 : 0);

  Serial.println("}");
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  // OLED
  oled.begin();

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x12_tf
  );

  oled.drawStr(
    25,
    25,
    "MIND-HEALTH"
  );

  oled.drawStr(
    28,
    43,
    "Starting..."
  );

  oled.sendBuffer();

  delay(1000);

  // MAX30102
  Serial.println(
    "Checking MAX30102..."
  );

  if (
    !sensor.begin(
      Wire,
      I2C_SPEED_FAST
    )
  ) {

    Serial.println(
      "MAX30102 NOT FOUND!"
    );

    oled.clearBuffer();

    oled.drawStr(
      15,
      25,
      "MAX30102 ERROR"
    );

    oled.drawStr(
      15,
      43,
      "Check wiring"
    );

    oled.sendBuffer();

    while (1)
      delay(100);
  }

  Serial.println(
    "MAX30102 OK"
  );

  /*
     IMPORTANT:

     SampleAverage = 1
     SampleRate    = 100 Hz

     This gives the custom BPM detector
     the full-resolution IR waveform.
  */

  sensor.setup(
    60,     // LED brightness
    1,      // sample average
    2,      // RED + IR
    100,    // sample rate
    411,    // pulse width
    4096    // ADC range
  );

  sensor.setPulseAmplitudeRed(
    0x3C
  );

  sensor.setPulseAmplitudeIR(
    0x3C
  );

  sensor.setPulseAmplitudeGreen(
    0
  );

  resetAll();

  Serial.println(
    "SYSTEM READY"
  );

  oled.clearBuffer();

  oled.drawStr(
    20,
    25,
    "SYSTEM READY"
  );

  oled.drawStr(
    18,
    45,
    "Place Finger"
  );

  oled.sendBuffer();

  delay(1000);
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // MAX30102
  sensor.check();

  processMAX30102();

  // EEG
  processEEG();

  // Measurement timer
  if (
    measuring &&
    millis() - measurementStart >=
    MEASUREMENT_TIME
  ) {

    measuring = false;
    ready = true;
  }

  // OLED
  if (
    millis() - lastOLED >= 150
  ) {

    lastOLED = millis();

    drawOLED();
  }

  // Serial
  if (
    millis() - lastSerial >= 1000
  ) {

    lastSerial = millis();

    printSerial();
  }

  delay(1);
}

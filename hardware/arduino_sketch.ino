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
// BIOAMP DEMO MODE
// =====================================================
// true  = BioAmp OUT disconnected; EEG values simulated
// false = real BioAmp on GPIO34
//
// NOTE:
// If using a 5V BioAmp with ESP32, use the required
// voltage divider/protection before GPIO34.
//
// =====================================================

#define BIOAMP_DEMO_MODE true

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
// MAX30102 SETTINGS
// =====================================================

#define FINGER_THRESHOLD 10000

#define SPO2_SIZE 100

uint32_t irBuffer[SPO2_SIZE];
uint32_t redBuffer[SPO2_SIZE];

int spo2Index = 0;
int decimation = 0;

// =====================================================
// SENSOR VALUES
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
// HEARTBEAT DETECTION
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

// SEND JSON EVERY 200ms = 5 TIMES/SECOND
#define SERIAL_INTERVAL 200

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

  return (
    temp[n / 2] +
    temp[n / 2 - 1]
  ) / 2.0;
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

  // Reset heartbeat waveform state
  irDC = 0;
  irAC = 0;

  previousAC = 0;
  previousPreviousAC = 0;

  for (int i = 0; i < BPM_HISTORY; i++)
    bpmValues[i] = 0;

  for (int i = 0; i < RR_SIZE; i++)
    rrValues[i] = 0;
}

// =====================================================
// HEARTBEAT DETECTION
// =====================================================

void detectHeartbeat(uint32_t ir) {

  if (!fingerPresent)
    return;

  // Slowly track DC component
  if (irDC == 0)
    irDC = ir;

  irDC =
    irDC * 0.95 +
    ir * 0.05;

  // Remove DC
  irAC =
    ir - irDC;

  // Dynamic threshold
  float threshold =
    max(
      250.0f,
      irDC * 0.0025f
    );

  // Local peak detection
  bool peak =
    previousAC > previousPreviousAC &&
    previousAC > irAC &&
    previousAC > threshold;

  if (peak && pulseArmed) {

    unsigned long now =
      millis();

    if (lastPulseTime > 0) {

      unsigned long interval =
        now - lastPulseTime;

      // Valid heart interval
      if (
        interval >= MIN_BEAT_INTERVAL &&
        interval <= MAX_BEAT_INTERVAL
      ) {

        float newBPM =
          60000.0 /
          interval;

        if (
          newBPM >= 40 &&
          newBPM <= 200
        ) {

          bpm =
            (int)newBPM;

          // -------------------------------------------
          // BPM HISTORY
          // -------------------------------------------

          bpmValues[bpmIndex] =
            newBPM;

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

          // -------------------------------------------
          // BPM SMOOTHING
          // -------------------------------------------

          if (bpmStable == 0) {

            bpmStable =
              (int)med;

          }
          else {

            bpmStable =
              (int)(
                bpmStable * 0.7 +
                med * 0.3
              );
          }

          // -------------------------------------------
          // HRV
          // -------------------------------------------

          rrValues[rrIndex] =
            interval;

          rrIndex++;

          if (rrIndex >= RR_SIZE)
            rrIndex = 0;

          if (rrCount < RR_SIZE)
            rrCount++;

          if (rrCount >= 2) {

            float sum = 0;

            for (
              int i = 0;
              i < rrCount;
              i++
            ) {

              sum +=
                rrValues[i];
            }

            float mean =
              sum / rrCount;

            float variance = 0;

            for (
              int i = 0;
              i < rrCount;
              i++
            ) {

              float d =
                rrValues[i] -
                mean;

              variance +=
                d * d;
            }

            variance /=
              rrCount;

            hrvSDNN =
              sqrt(variance);
          }
        }
      }
    }

    lastPulseTime =
      now;

    pulseArmed =
      false;
  }

  // Re-arm
  if (
    irAC <
    threshold * 0.3
  ) {

    pulseArmed =
      true;
  }

  previousPreviousAC =
    previousAC;

  previousAC =
    irAC;
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
     MAX30102:
     100 Hz

     SpO2:
     25 Hz

     Therefore take every 4th sample.
  */

  decimation++;

  if (decimation < 4)
    return;

  decimation = 0;

  if (spo2Index < SPO2_SIZE) {

    irBuffer[spo2Index] =
      ir;

    redBuffer[spo2Index] =
      red;

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

  algorithmSpO2 =
    algorithmO2;

  algorithmSpO2Valid =
    validO2;

  /*
     Accept sensible SpO2.
  */

  if (
    validO2 &&
    algorithmO2 >= 85 &&
    algorithmO2 <= 100
  ) {

    if (spo2 == 0) {

      spo2 =
        algorithmO2;

    }
    else {

      if (
        abs(
          algorithmO2 -
          spo2
        ) <= 5
      ) {

        spo2 =
          (spo2 * 0.8) +
          (algorithmO2 * 0.2);
      }
    }
  }

  /*
     Shift last 75 samples.
  */

  for (
    int i = 25;
    i < 100;
    i++
  ) {

    irBuffer[i - 25] =
      irBuffer[i];

    redBuffer[i - 25] =
      redBuffer[i];
  }

  /*
     Next 25 samples
     go into 75-99.
  */

  spo2Index = 75;
}

// =====================================================
// MAX30102 PROCESSING
// =====================================================

void processMAX30102() {

  while (
    sensor.available()
  ) {

    irValue =
      sensor.getIR();

    redValue =
      sensor.getRed();

    // Finger detection
    fingerPresent =
      irValue >
      FINGER_THRESHOLD;

    if (!fingerPresent) {

      resetAll();
    }

    else {

      // Start measurement
      if (
        !measuring &&
        !ready
      ) {

        measuring =
          true;

        measurementStart =
          millis();
      }

      // BPM
      detectHeartbeat(
        irValue
      );

      // SpO2
      processSpO2(
        irValue,
        redValue
      );
    }

    sensor.nextSample();
  }
}

// =====================================================
// EEG BAND POWER
// =====================================================

float bandPower(
  int *data,
  int size,
  float sampleRate,
  float low,
  float high
) {

  float total =
    0;

  int start =
    (int)(
      low *
      size /
      sampleRate
    );

  int end =
    (int)(
      high *
      size /
      sampleRate
    );

  if (start < 1)
    start = 1;

  if (end >= size / 2)
    end =
      size / 2 - 1;

  float mean =
    0;

  for (
    int i = 0;
    i < size;
    i++
  ) {

    mean +=
      data[i];
  }

  mean /=
    size;

  for (
    int k = start;
    k <= end;
    k++
  ) {

    float freq =
      k *
      sampleRate /
      size;

    float omega =
      2.0 *
      PI *
      freq /
      sampleRate;

    float coeff =
      2.0 *
      cos(omega);

    float q0 = 0;
    float q1 = 0;
    float q2 = 0;

    for (
      int i = 0;
      i < size;
      i++
    ) {

      float x =
        data[i] -
        mean;

      q0 =
        coeff *
        q1 -
        q2 +
        x;

      q2 =
        q1;

      q1 =
        q0;
    }

    float power =
      q1 * q1 +
      q2 * q2 -
      coeff *
      q1 *
      q2;

    if (power > 0)
      total +=
        power;
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
    theta /
    total *
    100;

  alphaPower =
    alpha /
    total *
    100;

  betaPower =
    beta /
    total *
    100;

  if (alphaPower > 0) {

    betaAlphaRatio =
      betaPower /
      alphaPower;
  }
  else {

    betaAlphaRatio =
      0;
  }

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
// EEG
// =====================================================

void processEEG() {

#if BIOAMP_DEMO_MODE

  /*
     DEMO MODE

     BioAmp is disconnected.
     EEG values are simulated.
  */

  float t =
    millis() /
    1000.0f;

  float a =
    34.0f +
    6.0f *
    sin(
      t * 0.35f
    );

  float b =
    31.0f +
    5.0f *
    sin(
      t * 0.27f +
      1.1f
    );

  float th =
    35.0f +
    5.0f *
    sin(
      t * 0.22f +
      2.0f
    );

  float total =
    a + b + th;

  if (total > 0) {

    alphaPower =
      a /
      total *
      100.0f;

    betaPower =
      b /
      total *
      100.0f;

    thetaPower =
      th /
      total *
      100.0f;
  }

  if (alphaPower > 0.01f) {

    betaAlphaRatio =
      betaPower /
      alphaPower;
  }
  else {

    betaAlphaRatio =
      0;
  }

  attention =
    constrain(
      (int)(
        betaPower * 1.5f +
        thetaPower * 0.2f
      ),
      0,
      100
    );

  meditation =
    constrain(
      (int)(
        alphaPower * 1.4f +
        thetaPower * 0.3f -
        betaPower * 0.3f
      ),
      0,
      100
    );

#else

  /*
     REAL BIOAMP
  */

  unsigned long now =
    micros();

  if (
    now - lastEEGMicros <
    (1000000UL /
     EEG_RATE)
  )
    return;

  lastEEGMicros =
    now;

  eegBuffer[eegIndex] =
    analogRead(
      BIOAMP_PIN
    );

  eegIndex++;

  if (
    eegIndex >=
    EEG_SIZE
  ) {

    eegIndex = 0;

    calculateEEG();
  }

#endif
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

  else if (
    measuring &&
    !ready
  ) {

    unsigned long elapsed =
      millis() -
      measurementStart;

    int remaining =
      10 -
      elapsed / 1000;

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
    }
    else {

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
    }
    else {

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
      "EEG on WEB"
    );
  }

  oled.sendBuffer();
}

// =====================================================
// JSON SERIAL OUTPUT
// =====================================================
//
// IMPORTANT:
// ONE JSON OBJECT = ONE SERIAL LINE
//
// Do NOT put debugging Serial.print() statements here.
// Your Python reader can parse these lines directly.
//

void printJSON() {

  Serial.print("{");

  // Sensor
  Serial.print("\"finger\":");
  Serial.print(
    fingerPresent ? 1 : 0
  );

  // Heart rate
  Serial.print(",\"bpm\":");
  Serial.print(
    bpmStable
  );

  // SpO2
  Serial.print(",\"spo2\":");
  Serial.print(
    spo2
  );

  // HRV
  Serial.print(",\"hrv_sdnn\":");
  Serial.print(
    hrvSDNN,
    2
  );

  // EEG
  Serial.print(",\"alpha\":");
  Serial.print(
    alphaPower,
    2
  );

  Serial.print(",\"beta\":");
  Serial.print(
    betaPower,
    2
  );

  Serial.print(",\"theta\":");
  Serial.print(
    thetaPower,
    2
  );

  Serial.print(",\"ba_ratio\":");
  Serial.print(
    betaAlphaRatio,
    2
  );

  // Mental state
  Serial.print(",\"attention\":");
  Serial.print(
    attention
  );

  Serial.print(",\"meditation\":");
  Serial.print(
    meditation
  );

  // Raw MAX30102
  Serial.print(",\"ir\":");
  Serial.print(
    irValue
  );

  // SpO2 diagnostic
  Serial.print(",\"algorithm_spo2\":");
  Serial.print(
    algorithmSpO2
  );

  Serial.print(",\"algorithm_spo2_valid\":");
  Serial.print(
    algorithmSpO2Valid
  );

  // Measurement state
  Serial.print(",\"measuring\":");
  Serial.print(
    measuring ? 1 : 0
  );

  Serial.print(",\"ready\":");
  Serial.print(
    ready ? 1 : 0
  );

  // End JSON
  Serial.println("}");
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  /*
     USB Serial is ONLY for JSON telemetry.
     Baud rate must match reader.py.
  */

  Serial.begin(115200);

  delay(1000);

  // I2C
  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  // ===================================================
  // OLED
  // ===================================================

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

  // ===================================================
  // MAX30102
  // ===================================================

  if (
    !sensor.begin(
      Wire,
      I2C_SPEED_FAST
    )
  ) {

    /*
       MAX30102 not found.
       Show error on OLED and send a JSON error
       packet so reader.py can report the problem.
    */

    oled.clearBuffer();

    oled.setFont(
      u8g2_font_6x12_tf
    );

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

    // Send periodic JSON error so reader.py knows
    while (1) {
      Serial.println("{\"error\":\"MAX30102_NOT_FOUND\",\"finger\":0,\"bpm\":0,\"spo2\":0,\"hrv_sdnn\":0,\"alpha\":0,\"beta\":0,\"theta\":0,\"ba_ratio\":0,\"attention\":0,\"meditation\":0,\"ir\":0,\"algorithm_spo2\":0,\"algorithm_spo2_valid\":0,\"measuring\":0,\"ready\":0}");
      delay(2000);
    }
  }

  /*
     MAX30102 configuration

     LED brightness = 60
     Average        = 1
     Mode           = RED + IR
     Sample rate    = 100 Hz
     Pulse width    = 411
     ADC range      = 4096
  */

  sensor.setup(
    60,
    1,
    2,
    100,
    411,
    4096
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

  // Ready screen
  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x12_tf
  );

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

  // ---------------------------------------------------
  // MAX30102
  // ---------------------------------------------------

  sensor.check();

  processMAX30102();

  // ---------------------------------------------------
  // EEG
  // ---------------------------------------------------

  processEEG();

  // ---------------------------------------------------
  // MEASUREMENT TIMER
  // ---------------------------------------------------

  if (
    measuring &&
    millis() -
    measurementStart >=
    MEASUREMENT_TIME
  ) {

    measuring = false;

    ready = true;
  }

  // ---------------------------------------------------
  // OLED
  // ---------------------------------------------------

  if (
    millis() -
    lastOLED >=
    150
  ) {

    lastOLED =
      millis();

    drawOLED();
  }

  // ---------------------------------------------------
  // JSON TO COMPUTER
  // ---------------------------------------------------

  if (
    millis() -
    lastSerial >=
    SERIAL_INTERVAL
  ) {

    lastSerial =
      millis();

    printJSON();
  }

  delay(1);
}

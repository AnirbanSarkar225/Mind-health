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

// ─── WiFi & HTTP (ESP32 only) ────────────────────────────────────────────────
#if defined(ESP32) || defined(ESP8266)
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiManager.h>  // https://github.com/tzapu/WiFiManager
  #include <Preferences.h>

  #define WIFI_ENABLED true
  #define WIFI_RESET_PIN 0         // Hold GPIO 0 for 5s to clear WiFi & re-enter setup
  #define RESET_HOLD_MS  5000

  Preferences prefs;
  WiFiManager wm;
  char serverIP[40] = "192.168.1.100";   // Default — overridden by portal
  char serverPort[6] = "5000";

  // Custom WiFiManager parameter for backend server IP & port
  WiFiManagerParameter customServerIP("server_ip", "Backend Server IP", serverIP, 40);
  WiFiManagerParameter customServerPort("server_port", "Backend Port", serverPort, 6);

  bool wifiConnected = false;
  unsigned long resetPressStart = 0;
  bool resetPending = false;
#else
  #define WIFI_ENABLED false
#endif

// ─── EEG Configuration ──────────────────────────────────────────────────────
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

// ─── WiFi Setup (ESP32 only) ────────────────────────────────────────────────
#if defined(ESP32) || defined(ESP8266)
void setupWiFi() {
  // Load saved server config from flash
  prefs.begin("neurosync", false);
  String savedIP = prefs.getString("srv_ip", "192.168.1.100");
  String savedPort = prefs.getString("srv_port", "5000");
  savedIP.toCharArray(serverIP, 40);
  savedPort.toCharArray(serverPort, 6);
  prefs.end();

  // Update default values for the portal fields
  customServerIP.setValue(serverIP, 40);
  customServerPort.setValue(serverPort, 6);

  // Add custom parameters to WiFiManager portal
  wm.addParameter(&customServerIP);
  wm.addParameter(&customServerPort);

  // Set portal timeout (5 minutes) and AP name
  wm.setConfigPortalTimeout(300);
  wm.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));

  Serial.println("[WiFi] Starting WiFiManager...");
  Serial.println("[WiFi] If not configured, connect to AP: 'NeuroSync-Setup'");

  // autoConnect: tries saved creds first, if fail → opens captive portal
  if (!wm.autoConnect("NeuroSync-Setup", "neurosync")) {
    Serial.println("[WiFi] Failed to connect. Continuing in Serial-only mode.");
    wifiConnected = false;
    return;
  }

  wifiConnected = true;
  Serial.print("[WiFi] Connected! IP: ");
  Serial.println(WiFi.localIP());

  // Save the custom server IP/port from the portal
  strncpy(serverIP, customServerIP.getValue(), 40);
  strncpy(serverPort, customServerPort.getValue(), 6);

  prefs.begin("neurosync", false);
  prefs.putString("srv_ip", serverIP);
  prefs.putString("srv_port", serverPort);
  prefs.end();

  Serial.print("[WiFi] Backend server: ");
  Serial.print(serverIP);
  Serial.print(":");
  Serial.println(serverPort);
}

void checkResetButton() {
  if (digitalRead(WIFI_RESET_PIN) == LOW) {
    if (!resetPending) {
      resetPending = true;
      resetPressStart = millis();
    } else if (millis() - resetPressStart >= RESET_HOLD_MS) {
      Serial.println("[WiFi] RESET: Clearing saved WiFi credentials...");
      wm.resetSettings();
      prefs.begin("neurosync", false);
      prefs.clear();
      prefs.end();
      Serial.println("[WiFi] Credentials cleared. Restarting...");
      ESP.restart();
    }
  } else {
    resetPending = false;
  }
}

bool sendDataHTTP(const char* jsonPayload) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  char url[100];
  snprintf(url, sizeof(url), "http://%s:%s/api/esp32", serverIP, serverPort);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(2000);  // 2-second timeout

  int httpCode = http.POST(jsonPayload);
  http.end();

  if (httpCode == 200 || httpCode == 201) {
    return true;
  } else {
    Serial.print("[HTTP] POST failed, code: ");
    Serial.println(httpCode);
    return false;
  }
}
#endif

// ─── EEG Processing ─────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  pinMode(EEG_ANALOG_PIN, INPUT);

  #if defined(ESP32) || defined(ESP8266)
    pinMode(WIFI_RESET_PIN, INPUT_PULLUP);
    setupWiFi();
  #endif

  Serial.println("[NeuroSync] EEG telemetry started.");
  Serial.println("[NeuroSync] Sampling at 256 Hz, transmitting every 500ms.");
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

  #if defined(ESP32) || defined(ESP8266)
    checkResetButton();
  #endif

  // Sample EEG at 256 Hz
  if (micros() - lastSampleTime >= 3906) {
    lastSampleTime = micros();
    rawBuffer[bufferIndex] = analogRead(EEG_ANALOG_PIN);
    bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
  }

  // Transmit every 500ms
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    processEEGBands();

    // Build JSON payload
    char json[256];
    snprintf(json, sizeof(json),
      "{\"attention\":%.1f,\"meditation\":%.1f,\"alpha\":%.1f,\"beta\":%.1f,\"theta\":%.1f,\"ba_ratio\":%.2f,\"timestamp\":%lu}",
      eeg_attention, eeg_meditation, alpha_power, beta_power, theta_power, ba_ratio, now
    );

    // Always output to Serial (debug + fallback)
    Serial.println(json);

    // Send via WiFi HTTP POST if connected
    #if defined(ESP32) || defined(ESP8266)
      if (wifiConnected && WiFi.status() == WL_CONNECTED) {
        sendDataHTTP(json);
      }
    #endif
  }
}

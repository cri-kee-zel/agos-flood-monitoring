/*
 * ════════════════════════════════════════════════════════════════════
 *  AGOS FLOOD MONITORING WITH GPS TRACKING - Arduino R4 WiFi
 * ════════════════════════════════════════════════════════════════════
 *
 * Integrates with AGOS Module 2 (AI Mapping) and Module 4 (Emergency Response)
 *
 * HARDWARE CONFIGURATION:
 * - Arduino UNO R4 WiFi
 *
 * - NEO-6M GPS Module
 *   - VCC → 5V
 *   - GND → GND
 *   - TX (GPS) → Pin 4 (Arduino RX)
 *   - RX (GPS) → Pin 5 (Arduino TX)
 *
 * - SIM800L GSM Module (Optional - for SMS)
 *   - RX (SIM800L) → Pin 2 (Arduino)
 *   - TX (SIM800L) → Pin 3 (Arduino)
 *   - GND → GND
 *   - VCC → External 4.2V power supply
 *
 * - Water Level Sensors (TSOP38238 + IR LED)
 *   - Sensor 1 (10" Half-knee): A0 + Pin 9
 *   - Sensor 2 (19" Knee): A1 + Pin 10
 *   - Sensor 3 (37" Waist): A3 + Pin 13
 *
 * FEATURES:
 * 1. Real-time GPS coordinate tracking (NEO-6M)
 * 2. Water level monitoring with 3 IR sensors
 * 3. Sends GPS + sensor data to AGOS server
 * 4. Auto-updates Module 2 map with current location
 * 5. Flood extent visualization based on GPS + topography
 *
 * GPS DATA FORMAT SENT TO SERVER:
 * {
 *   "latitude": 9.7395,
 *   "longitude": 118.7357,
 *   "altitude": 12.5,
 *   "satellites": 8,
 *   "accuracy": 2.5,
 *   "waterLevel": 0,
 *   "batteryLevel": 85,
 *   "timestamp": "2025-10-25T04:00:00Z"
 * }
 *
 * AUTHOR: AGOS Team
 * DATE: October 2025
 * VERSION: 2.0 - With GPS Integration
 * ════════════════════════════════════════════════════════════════════
 */

#include <SoftwareSerial.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <TinyGPSPlus.h>

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";         // Change to your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Change to your WiFi password

// AGOS Server Configuration
const char* SERVER_HOST = "192.168.1.5";  // Change to your server IP
const int SERVER_PORT = 3000;

// GPS Configuration (NEO-6M on pins 4 & 5)
SoftwareSerial gpsSerial(4, 5); // RX=4, TX=5
TinyGPSPlus gps;

// SIM800L Configuration (Optional - for SMS alerts)
// SoftwareSerial sim800(2, 3); // RX=2, TX=3

// Water Level Sensor Configuration
const int SENSOR1_LED = 9;   // IR LED for sensor 1 (10" - Half-knee)
const int SENSOR1_TSOP = A0; // TSOP receiver for sensor 1
const int SENSOR2_LED = 10;  // IR LED for sensor 2 (19" - Knee)
const int SENSOR2_TSOP = A1; // TSOP receiver for sensor 2
const int SENSOR3_LED = 13;  // IR LED for sensor 3 (37" - Waist)
const int SENSOR3_TSOP = A3; // TSOP receiver for sensor 3

// Sensor thresholds (calibrated values)
const int SENSOR_THRESHOLD = 500;

// Timing Configuration
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 10000; // Send data every 10 seconds

unsigned long lastGPSRead = 0;
const unsigned long GPS_READ_INTERVAL = 1000; // Read GPS every 1 second

// ═══════════════════════════════════════════════════════════════════
// GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════════════════

// WiFi and HTTP client
WiFiClient wifi;
HttpClient httpClient = HttpClient(wifi, SERVER_HOST, SERVER_PORT);

// GPS Data
struct GPSData {
  double latitude;
  double longitude;
  double altitude;
  int satellites;
  double hdop;  // Horizontal Dilution of Precision (accuracy indicator)
  bool valid;
  String timestamp;
} gpsData;

// Sensor Data
struct SensorData {
  int waterLevel;
  int sensor1Value;
  int sensor2Value;
  int sensor3Value;
  int batteryLevel;
} sensorData;

// System Status
bool wifiConnected = false;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 5;

// ═══════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  Serial.println("\n╔════════════════════════════════════════════════╗");
  Serial.println("║   AGOS GPS-ENABLED FLOOD MONITORING SYSTEM    ║");
  Serial.println("║   Arduino UNO R4 WiFi + NEO-6M GPS Module     ║");
  Serial.println("╚════════════════════════════════════════════════╝\n");

  // Initialize GPS module
  Serial.println("📡 Initializing NEO-6M GPS Module...");
  gpsSerial.begin(9600);
  delay(1000);
  Serial.println("✅ GPS Serial initialized at 9600 baud");

  // Initialize water level sensors
  Serial.println("\n💧 Initializing Water Level Sensors...");
  pinMode(SENSOR1_LED, OUTPUT);
  pinMode(SENSOR2_LED, OUTPUT);
  pinMode(SENSOR3_LED, OUTPUT);
  pinMode(SENSOR1_TSOP, INPUT);
  pinMode(SENSOR2_TSOP, INPUT);
  pinMode(SENSOR3_TSOP, INPUT);
  Serial.println("✅ Sensors initialized");

  // Initialize sensor data
  sensorData.waterLevel = 0;
  sensorData.batteryLevel = 85; // Mock battery level

  // Initialize GPS data
  gpsData.valid = false;
  gpsData.latitude = 0.0;
  gpsData.longitude = 0.0;
  gpsData.altitude = 0.0;
  gpsData.satellites = 0;
  gpsData.hdop = 99.99;

  // Connect to WiFi
  connectToWiFi();

  Serial.println("\n╔════════════════════════════════════════════════╗");
  Serial.println("║           SYSTEM READY - WAITING FOR GPS      ║");
  Serial.println("╚════════════════════════════════════════════════╝\n");

  Serial.println("📍 Waiting for GPS fix... (may take 1-2 minutes)");
  Serial.println("   Move Arduino near window for better signal\n");
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════

void loop() {
  // Read GPS data continuously
  readGPSData();

  // Send data to server at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastDataSend >= DATA_SEND_INTERVAL) {
    lastDataSend = currentMillis;

    // Read sensor values
    readWaterLevelSensors();

    // Send combined GPS + sensor data to server
    sendDataToServer();
  }

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected! Attempting reconnection...");
    connectToWiFi();
  }
}

// ═══════════════════════════════════════════════════════════════════
// GPS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void readGPSData() {
  // Read all available GPS data
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();

    // Feed the character to TinyGPSPlus
    if (gps.encode(c)) {
      // GPS data updated
      if (gps.location.isUpdated()) {
        gpsData.latitude = gps.location.lat();
        gpsData.longitude = gps.location.lng();
        gpsData.valid = gps.location.isValid();

        // Show GPS update (first time or every 10 seconds)
        static unsigned long lastGPSPrint = 0;
        if (millis() - lastGPSPrint >= 10000 || !gpsData.valid) {
          lastGPSPrint = millis();
          Serial.print("📍 GPS: ");
          if (gpsData.valid) {
            Serial.print(gpsData.latitude, 6);
            Serial.print(", ");
            Serial.println(gpsData.longitude, 6);
          } else {
            Serial.println("No fix yet...");
          }
        }
      }

      if (gps.altitude.isUpdated()) {
        gpsData.altitude = gps.altitude.meters();
      }

      if (gps.satellites.isUpdated()) {
        gpsData.satellites = gps.satellites.value();
      }

      if (gps.hdop.isUpdated()) {
        gpsData.hdop = gps.hdop.hdop();
      }

      if (gps.date.isUpdated() && gps.time.isUpdated()) {
        // Format timestamp: YYYY-MM-DDTHH:MM:SSZ
        char timestamp[25];
        sprintf(timestamp, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          gps.date.year(), gps.date.month(), gps.date.day(),
          gps.time.hour(), gps.time.minute(), gps.time.second());
        gpsData.timestamp = String(timestamp);
      }
    }
  }

  // Check for GPS timeout (no data received)
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    static unsigned long lastWarning = 0;
    if (millis() - lastWarning >= 30000) {
      lastWarning = millis();
      Serial.println("⚠️ No GPS data received. Check wiring:");
      Serial.println("   GPS TX → Arduino Pin 4 (RX)");
      Serial.println("   GPS RX → Arduino Pin 5 (TX)");
    }
  }
}

void printGPSInfo() {
  Serial.println("\n╔════════════════════════════════════════════════╗");
  Serial.println("║              GPS STATUS REPORT                 ║");
  Serial.println("╚════════════════════════════════════════════════╝");

  if (gpsData.valid) {
    Serial.print("📍 Latitude:   "); Serial.println(gpsData.latitude, 6);
    Serial.print("📍 Longitude:  "); Serial.println(gpsData.longitude, 6);
    Serial.print("⛰️  Altitude:   "); Serial.print(gpsData.altitude, 1); Serial.println(" m");
    Serial.print("🛰️  Satellites: "); Serial.println(gpsData.satellites);
    Serial.print("🎯 HDOP:       "); Serial.println(gpsData.hdop, 2);
    Serial.print("🕐 Time:       "); Serial.println(gpsData.timestamp);

    // Accuracy assessment
    if (gpsData.hdop < 2.0) {
      Serial.println("✅ Excellent accuracy");
    } else if (gpsData.hdop < 5.0) {
      Serial.println("✅ Good accuracy");
    } else if (gpsData.hdop < 10.0) {
      Serial.println("⚠️ Moderate accuracy");
    } else {
      Serial.println("❌ Poor accuracy");
    }
  } else {
    Serial.println("❌ No GPS fix available");
    Serial.println("   Satellites in view: " + String(gpsData.satellites));
    Serial.println("   Move to open area with clear sky view");
  }
  Serial.println();
}

// ═══════════════════════════════════════════════════════════════════
// WATER LEVEL SENSOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void readWaterLevelSensors() {
  // Read sensor 1 (10" - Half-knee)
  digitalWrite(SENSOR1_LED, HIGH);
  delay(5);
  sensorData.sensor1Value = analogRead(SENSOR1_TSOP);
  digitalWrite(SENSOR1_LED, LOW);
  delay(5);

  // Read sensor 2 (19" - Knee)
  digitalWrite(SENSOR2_LED, HIGH);
  delay(5);
  sensorData.sensor2Value = analogRead(SENSOR2_TSOP);
  digitalWrite(SENSOR2_LED, LOW);
  delay(5);

  // Read sensor 3 (37" - Waist)
  digitalWrite(SENSOR3_LED, HIGH);
  delay(5);
  sensorData.sensor3Value = analogRead(SENSOR3_TSOP);
  digitalWrite(SENSOR3_LED, LOW);
  delay(5);

  // Determine water level (0, 1, 2, or 3)
  sensorData.waterLevel = 0;
  if (sensorData.sensor1Value < SENSOR_THRESHOLD) sensorData.waterLevel = 1;
  if (sensorData.sensor2Value < SENSOR_THRESHOLD) sensorData.waterLevel = 2;
  if (sensorData.sensor3Value < SENSOR_THRESHOLD) sensorData.waterLevel = 3;

  // Print sensor status
  Serial.print("💧 Water Level: ");
  Serial.print(sensorData.waterLevel);
  Serial.print(" | Sensors: [");
  Serial.print(sensorData.sensor1Value);
  Serial.print(", ");
  Serial.print(sensorData.sensor2Value);
  Serial.print(", ");
  Serial.print(sensorData.sensor3Value);
  Serial.println("]");
}

// ═══════════════════════════════════════════════════════════════════
// NETWORK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void connectToWiFi() {
  Serial.println("\n📶 Connecting to WiFi...");
  Serial.print("   SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("   Check SSID and password in code");
  }
}

void sendDataToServer() {
  if (!wifiConnected) {
    Serial.println("⚠️ Cannot send data - WiFi not connected");
    return;
  }

  Serial.println("\n╔════════════════════════════════════════════════╗");
  Serial.println("║       SENDING DATA TO AGOS SERVER             ║");
  Serial.println("╚════════════════════════════════════════════════╝");

  // Print GPS info before sending
  if (gpsData.valid) {
    printGPSInfo();
  }

  // Build JSON payload
  String jsonPayload = "{";

  // GPS Data
  jsonPayload += "\"latitude\":" + String(gpsData.latitude, 6) + ",";
  jsonPayload += "\"longitude\":" + String(gpsData.longitude, 6) + ",";
  jsonPayload += "\"altitude\":" + String(gpsData.altitude, 1) + ",";
  jsonPayload += "\"satellites\":" + String(gpsData.satellites) + ",";
  jsonPayload += "\"hdop\":" + String(gpsData.hdop, 2) + ",";
  jsonPayload += "\"gpsValid\":" + String(gpsData.valid ? "true" : "false") + ",";

  // Sensor Data
  jsonPayload += "\"waterLevel\":" + String(sensorData.waterLevel) + ",";
  jsonPayload += "\"sensor1\":" + String(sensorData.sensor1Value) + ",";
  jsonPayload += "\"sensor2\":" + String(sensorData.sensor2Value) + ",";
  jsonPayload += "\"sensor3\":" + String(sensorData.sensor3Value) + ",";
  jsonPayload += "\"batteryLevel\":" + String(sensorData.batteryLevel) + ",";

  // Timestamp
  if (gpsData.timestamp.length() > 0) {
    jsonPayload += "\"timestamp\":\"" + gpsData.timestamp + "\"";
  } else {
    jsonPayload += "\"timestamp\":\"" + String(millis()) + "\"";
  }

  jsonPayload += "}";

  Serial.println("📤 Sending JSON:");
  Serial.println(jsonPayload);

  // Send HTTP POST request
  httpClient.beginRequest();
  httpClient.post("/api/arduino-gps-data");
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonPayload.length());
  httpClient.beginBody();
  httpClient.print(jsonPayload);
  httpClient.endRequest();

  // Get response
  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();

  Serial.print("📥 Response: ");
  Serial.print(statusCode);
  Serial.print(" ");

  if (statusCode == 200) {
    Serial.println("✅ SUCCESS");
    Serial.println("   " + response);
  } else if (statusCode == 0) {
    Serial.println("❌ FAILED - No response from server");
    Serial.println("   Check server IP and port");
  } else {
    Serial.println("⚠️ ERROR");
    Serial.println("   " + response);
  }

  Serial.println();
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void printSystemStatus() {
  Serial.println("\n╔════════════════════════════════════════════════╗");
  Serial.println("║           SYSTEM STATUS REPORT                 ║");
  Serial.println("╚════════════════════════════════════════════════╝");

  // WiFi Status
  Serial.print("📶 WiFi: ");
  if (wifiConnected) {
    Serial.print("✅ Connected (");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm)");
  } else {
    Serial.println("❌ Disconnected");
  }

  // GPS Status
  Serial.print("📍 GPS: ");
  if (gpsData.valid) {
    Serial.print("✅ Fixed (");
    Serial.print(gpsData.satellites);
    Serial.println(" satellites)");
  } else {
    Serial.println("❌ No fix");
  }

  // Water Level
  Serial.print("💧 Water Level: ");
  Serial.print(sensorData.waterLevel);
  Serial.println("/3");

  // Battery
  Serial.print("🔋 Battery: ");
  Serial.print(sensorData.batteryLevel);
  Serial.println("%");

  Serial.println();
}

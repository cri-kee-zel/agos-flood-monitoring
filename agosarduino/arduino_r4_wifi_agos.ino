/*
 * AGOS - Arduino R4 WiFi Integration
 * Advanced Ground Observation System
 *
 * This sketch connects Arduino R4 WiFi to the AGOS Node.js server
 * and sends sensor data via HTTP POST requests.
 *
 * Hardware: Arduino R4 WiFi
 * Sensors: 3x TSOP38238 IR receivers for water level detection
 *
 * Author: AGOS Development Team
 * Date: November 2025
 */

#include <WiFiS3.h>

// ========================================
// WiFi Configuration
// ========================================
const char* WIFI_SSID = "PLDTHOMEFIBRcalcifer";        // Your WiFi network name
const char* WIFI_PASSWORD = "PLDTsWeetneZuko-12"; // Your WiFi password

// ========================================
// Server Configuration
// ========================================
const char* SERVER_HOST = "178.128.83.244";  // Digital Ocean server IP (production)
// const char* SERVER_HOST = "192.168.1.5";  // localhost IP (for testing)
const int SERVER_PORT = 3000;
const char* ENDPOINT = "/api/arduino-serial";

// ========================================
// Sensor Configuration
// ========================================
// IR LED Pins (PWM output to ULN2803)
const int IR_LED_1 = 9;   // Sensor 1 - Half Knee (10 inches)
const int IR_LED_2 = 10;  // Sensor 2 - Knee (19 inches)
const int IR_LED_3 = 11;  // Sensor 3 - Waist (37 inches)

// TSOP38238 Receiver Pins (Analog input)
const int RECEIVER_1 = A0; // Sensor 1 receiver
const int RECEIVER_2 = A1; // Sensor 2 receiver
const int RECEIVER_3 = A2; // Sensor 3 receiver

// Water level heights (in inches)
const float LEVEL_1_HEIGHT = 10.0; // Half knee
const float LEVEL_2_HEIGHT = 19.0; // Knee
const float LEVEL_3_HEIGHT = 37.0; // Waist

// ========================================
// Calibration Data (adjust based on your sensors)
// ========================================
struct SensorCalibration {
  int blockedThreshold;    // Reading when IR beam is blocked (water present)
  int unblockedThreshold;  // Reading when IR beam is clear (no water)
};

SensorCalibration sensor1 = {300, 700}; // Adjust these values after testing
SensorCalibration sensor2 = {300, 700};
SensorCalibration sensor3 = {300, 700};

// ========================================
// Timing Configuration
// ========================================
const unsigned long SENSOR_READ_INTERVAL = 1000;  // Read sensors every 1 second
const unsigned long SERVER_SEND_INTERVAL = 5000;  // Send to server every 5 seconds
const unsigned long HEARTBEAT_INTERVAL = 30000;   // Send heartbeat every 30 seconds
const unsigned long COMMAND_POLL_INTERVAL = 2000; // Poll for commands every 2 seconds

unsigned long lastSensorRead = 0;
unsigned long lastServerSend = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastCommandPoll = 0;

// ========================================
// Global Variables
// ========================================
WiFiClient client;
float currentWaterLevel = 0.0;
bool sensor1Triggered = false;
bool sensor2Triggered = false;
bool sensor3Triggered = false;

// Connection status
bool wifiConnected = false;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 5;

// ========================================
// Setup Function
// ========================================
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // Wait for serial monitor (max 3 seconds)

  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║   AGOS - Arduino R4 WiFi Starting     ║");
  Serial.println("║   Advanced Ground Observation System   ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println();

  // Initialize IR LED pins as outputs
  pinMode(IR_LED_1, OUTPUT);
  pinMode(IR_LED_2, OUTPUT);
  pinMode(IR_LED_3, OUTPUT);

  // Initialize receiver pins as inputs
  pinMode(RECEIVER_1, INPUT);
  pinMode(RECEIVER_2, INPUT);
  pinMode(RECEIVER_3, INPUT);

  // Start with LEDs off
  digitalWrite(IR_LED_1, LOW);
  digitalWrite(IR_LED_2, LOW);
  digitalWrite(IR_LED_3, LOW);

  Serial.println("✓ Hardware initialized");
  Serial.println("✓ Sensor pins configured");
  Serial.println();

  // Connect to WiFi
  connectToWiFi();

  // Initial sensor test
  Serial.println("🔬 Running initial sensor test...");
  testSensors();
  Serial.println();

  Serial.println("🚀 System ready!");
  Serial.println("📡 Sending data to: http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT) + ENDPOINT);
  Serial.println();
}

// ========================================
// Main Loop
// ========================================
void loop() {
  unsigned long currentMillis = millis();

  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      Serial.println("⚠️ WiFi connection lost! Reconnecting...");
      wifiConnected = false;
    }
    connectToWiFi();
    return;
  } else {
    wifiConnected = true;
  }

  // Read sensors at specified interval
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensors();
    calculateWaterLevel();
  }

  // Send data to server at specified interval
  if (currentMillis - lastServerSend >= SERVER_SEND_INTERVAL) {
    lastServerSend = currentMillis;
    sendDataToServer();
  }

  // Send heartbeat to show we're alive
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = currentMillis;
    sendHeartbeat();
  }

  // Poll server for commands (two-way communication)
  if (currentMillis - lastCommandPoll >= COMMAND_POLL_INTERVAL) {
    lastCommandPoll = currentMillis;
    pollForCommands();
  }

  // Check for incoming serial commands
  handleSerialCommands();
}

// ========================================
// WiFi Connection Function
// ========================================
void connectToWiFi() {
  Serial.println("📡 Connecting to WiFi...");
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
    Serial.println();
    Serial.println("✅ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    wifiConnected = true;
    reconnectAttempts = 0;
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed!");
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      Serial.println("⚠️ Max reconnection attempts reached. Waiting 60 seconds...");
      delay(60000);
      reconnectAttempts = 0;
    }
  }
  Serial.println();
}

// ========================================
// Sensor Reading Functions
// ========================================
void readSensors() {
  // Turn on IR LEDs with PWM (38kHz modulation is handled by ULN2803 circuit)
  analogWrite(IR_LED_1, 128); // 50% duty cycle
  analogWrite(IR_LED_2, 128);
  analogWrite(IR_LED_3, 128);

  delay(10); // Let the signal stabilize

  // Read analog values from TSOP receivers
  int reading1 = analogRead(RECEIVER_1);
  int reading2 = analogRead(RECEIVER_2);
  int reading3 = analogRead(RECEIVER_3);

  // Turn off LEDs to save power
  digitalWrite(IR_LED_1, LOW);
  digitalWrite(IR_LED_2, LOW);
  digitalWrite(IR_LED_3, LOW);

  // Determine if sensors are triggered (water blocking IR beam)
  sensor1Triggered = (reading1 < sensor1.blockedThreshold);
  sensor2Triggered = (reading2 < sensor2.blockedThreshold);
  sensor3Triggered = (reading3 < sensor3.blockedThreshold);

  // Debug output (comment out after calibration)
  // Serial.print("Raw readings: S1=");
  // Serial.print(reading1);
  // Serial.print(" S2=");
  // Serial.print(reading2);
  // Serial.print(" S3=");
  // Serial.println(reading3);
}

void calculateWaterLevel() {
  // Determine water level based on triggered sensors
  if (sensor3Triggered) {
    currentWaterLevel = LEVEL_3_HEIGHT; // Waist level (37")
  } else if (sensor2Triggered) {
    currentWaterLevel = LEVEL_2_HEIGHT; // Knee level (19")
  } else if (sensor1Triggered) {
    currentWaterLevel = LEVEL_1_HEIGHT; // Half knee (10")
  } else {
    currentWaterLevel = 0.0; // No water detected
  }
}

void testSensors() {
  Serial.println("   Testing Sensor 1 (10\")...");
  digitalWrite(IR_LED_1, HIGH);
  delay(100);
  int test1 = analogRead(RECEIVER_1);
  digitalWrite(IR_LED_1, LOW);
  Serial.print("   Reading: ");
  Serial.println(test1);

  Serial.println("   Testing Sensor 2 (19\")...");
  digitalWrite(IR_LED_2, HIGH);
  delay(100);
  int test2 = analogRead(RECEIVER_2);
  digitalWrite(IR_LED_2, LOW);
  Serial.print("   Reading: ");
  Serial.println(test2);

  Serial.println("   Testing Sensor 3 (37\")...");
  digitalWrite(IR_LED_3, HIGH);
  delay(100);
  int test3 = analogRead(RECEIVER_3);
  digitalWrite(IR_LED_3, LOW);
  Serial.print("   Reading: ");
  Serial.println(test3);
}

// ========================================
// Server Communication Functions
// ========================================
void sendDataToServer() {
  if (!wifiConnected) return;

  Serial.println("📤 Sending data to server...");

  // Prepare JSON payload
  String jsonData = "{";
  jsonData += "\"type\":\"sensor-data\",";
  jsonData += "\"waterLevel\":" + String(currentWaterLevel, 2) + ",";
  jsonData += "\"sensor1\":" + String(sensor1Triggered ? "true" : "false") + ",";
  jsonData += "\"sensor2\":" + String(sensor2Triggered ? "true" : "false") + ",";
  jsonData += "\"sensor3\":" + String(sensor3Triggered ? "true" : "false") + ",";
  jsonData += "\"timestamp\":\"" + getTimestamp() + "\",";
  jsonData += "\"rssi\":" + String(WiFi.RSSI());
  jsonData += "}";

  // Connect to server
  if (client.connect(SERVER_HOST, SERVER_PORT)) {
    // Send HTTP POST request
    client.println("POST " + String(ENDPOINT) + " HTTP/1.1");
    client.println("Host: " + String(SERVER_HOST));
    client.println("Content-Type: application/json");
    client.println("Content-Length: " + String(jsonData.length()));
    client.println("Connection: close");
    client.println();
    client.println(jsonData);

    Serial.println("✅ Data sent successfully");
    Serial.println("   Water Level: " + String(currentWaterLevel, 2) + " inches");
    Serial.println("   Sensors: S1=" + String(sensor1Triggered) + " S2=" + String(sensor2Triggered) + " S3=" + String(sensor3Triggered));

    // Wait for response
    delay(100);
    while (client.available()) {
      String line = client.readStringUntil('\r');
      // Uncomment to see server response
      // Serial.print(line);
    }

    client.stop();
  } else {
    Serial.println("❌ Connection to server failed!");
  }
  Serial.println();
}

void sendHeartbeat() {
  if (!wifiConnected) return;

  Serial.println("💓 Sending heartbeat...");

  String jsonData = "{";
  jsonData += "\"type\":\"heartbeat\",";
  jsonData += "\"timestamp\":\"" + getTimestamp() + "\",";
  jsonData += "\"uptime\":" + String(millis() / 1000) + ",";
  jsonData += "\"rssi\":" + String(WiFi.RSSI());
  jsonData += "}";

  if (client.connect(SERVER_HOST, SERVER_PORT)) {
    client.println("POST " + String(ENDPOINT) + " HTTP/1.1");
    client.println("Host: " + String(SERVER_HOST));
    client.println("Content-Type: application/json");
    client.println("Content-Length: " + String(jsonData.length()));
    client.println("Connection: close");
    client.println();
    client.println(jsonData);

    Serial.println("✅ Heartbeat sent");
    client.stop();
  }
  Serial.println();
}

// ========================================
// Poll Server for Commands (Two-Way Communication)
// ========================================
void pollForCommands() {
  if (!wifiConnected) return;

  WiFiClient cmdClient;

  if (cmdClient.connect(SERVER_HOST, SERVER_PORT)) {
    // Send HTTP GET request
    cmdClient.println("GET /api/arduino-command HTTP/1.1");
    cmdClient.println("Host: " + String(SERVER_HOST));
    cmdClient.println("Connection: close");
    cmdClient.println();

    // Wait for response
    unsigned long timeout = millis();
    while (cmdClient.connected() && millis() - timeout < 3000) {
      if (cmdClient.available()) {
        String line = cmdClient.readStringUntil('\n');

        // Look for JSON response
        if (line.startsWith("{")) {
          // Parse JSON manually (simple approach)
          int cmdStart = line.indexOf("\"command\":\"");
          if (cmdStart > 0) {
            cmdStart += 11; // Length of "command":\"
            int cmdEnd = line.indexOf("\"", cmdStart);
            if (cmdEnd > cmdStart) {
              String command = line.substring(cmdStart, cmdEnd);

              if (command != "null" && command.length() > 0) {
                Serial.println();
                Serial.println("📥 Command from web: " + command);
                executeCommand(command);
              }
            }
          }
          break;
        }
      }
      delay(10);
    }

    cmdClient.stop();
  }
}

// Execute commands received from web interface
void executeCommand(String command) {
  command.trim();
  command.toLowerCase();

  if (command == "status") {
    printStatus();
  } else if (command == "test") {
    testSensors();
  } else if (command == "wifi") {
    printWiFiStatus();
  } else if (command == "calibrate") {
    runCalibration();
  } else if (command == "help") {
    printHelp();
  } else if (command == "reset") {
    Serial.println("🔄 Resetting Arduino...");
    delay(1000);
    NVIC_SystemReset();
  } else if (command == "sim0" || command == "clear") {
    Serial.println("🌊 Simulating: CLEAR (0 inches)");
    sensor1Triggered = false;
    sensor2Triggered = false;
    sensor3Triggered = false;
    currentWaterLevel = 0.0;
    sendDataToServer();
  } else if (command == "sim10" || command == "half") {
    Serial.println("🌊 Simulating: HALF KNEE (10 inches)");
    sensor1Triggered = true;
    sensor2Triggered = false;
    sensor3Triggered = false;
    currentWaterLevel = 10.0;
    sendDataToServer();
  } else if (command == "sim19" || command == "knee") {
    Serial.println("🌊 Simulating: KNEE LEVEL (19 inches)");
    sensor1Triggered = true;
    sensor2Triggered = true;
    sensor3Triggered = false;
    currentWaterLevel = 19.0;
    sendDataToServer();
  } else if (command == "sim37" || command == "waist") {
    Serial.println("🌊 Simulating: WAIST LEVEL (37 inches)");
    sensor1Triggered = true;
    sensor2Triggered = true;
    sensor3Triggered = true;
    currentWaterLevel = 37.0;
    sendDataToServer();
  } else if (command == "ping") {
    Serial.println("🏓 Pong! System is alive and responding.");
    Serial.println("   Uptime: " + String(millis() / 1000) + "s");
  } else if (command == "demo") {
    Serial.println("🎬 Running demo sequence...");
    runDemoSequence();
  } else {
    Serial.println("❌ Unknown command: " + command);
  }
  Serial.println();
}

// ========================================
// Serial Command Handler
// ========================================
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    Serial.println();
    Serial.println("📥 Command received from Serial: " + command);

    // Use the same command execution function
    executeCommand(command);
  }
}

void printStatus() {
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║         SYSTEM STATUS REPORT           ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println("📊 Current Water Level: " + String(currentWaterLevel, 2) + " inches");
  Serial.println("🌊 Sensor Status:");
  Serial.println("   Sensor 1 (10\"): " + String(sensor1Triggered ? "TRIGGERED ●" : "Clear ○"));
  Serial.println("   Sensor 2 (19\"): " + String(sensor2Triggered ? "TRIGGERED ●" : "Clear ○"));
  Serial.println("   Sensor 3 (37\"): " + String(sensor3Triggered ? "TRIGGERED ●" : "Clear ○"));
  Serial.println("📡 WiFi: " + String(wifiConnected ? "Connected ✓" : "Disconnected ✗"));
  if (wifiConnected) {
    Serial.println("   IP: " + WiFi.localIP().toString());
    Serial.println("   RSSI: " + String(WiFi.RSSI()) + " dBm");
  }
  Serial.println("⏱️ Uptime: " + String(millis() / 1000) + " seconds");
}

void printWiFiStatus() {
  Serial.println("📡 WiFi Status:");
  Serial.println("   SSID: " + String(WIFI_SSID));
  Serial.println("   Status: " + String(wifiConnected ? "Connected" : "Disconnected"));
  if (wifiConnected) {
    Serial.println("   IP Address: " + WiFi.localIP().toString());
    Serial.println("   Signal Strength: " + String(WiFi.RSSI()) + " dBm");

    // Get MAC address
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[18];
    sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    Serial.println("   MAC Address: " + String(macStr));
  }
}

void runCalibration() {
  Serial.println("🔧 Starting sensor calibration...");
  Serial.println("   Please ensure NO water is present in the sensors");
  Serial.println("   Reading in 3 seconds...");
  delay(3000);

  digitalWrite(IR_LED_1, HIGH);
  digitalWrite(IR_LED_2, HIGH);
  digitalWrite(IR_LED_3, HIGH);
  delay(100);

  int clear1 = analogRead(RECEIVER_1);
  int clear2 = analogRead(RECEIVER_2);
  int clear3 = analogRead(RECEIVER_3);

  digitalWrite(IR_LED_1, LOW);
  digitalWrite(IR_LED_2, LOW);
  digitalWrite(IR_LED_3, LOW);

  Serial.println("✓ Clear readings:");
  Serial.println("   Sensor 1: " + String(clear1));
  Serial.println("   Sensor 2: " + String(clear2));
  Serial.println("   Sensor 3: " + String(clear3));
  Serial.println();
  Serial.println("   Now block each sensor and note the readings");
  Serial.println("   Update the calibration values in the code");
}

void printHelp() {
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║         AVAILABLE COMMANDS             ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println("System Commands:");
  Serial.println("   status     - Display system status");
  Serial.println("   test       - Test all sensors");
  Serial.println("   wifi       - WiFi connection info");
  Serial.println("   calibrate  - Run sensor calibration");
  Serial.println("   reset      - Restart Arduino");
  Serial.println("   ping       - Check if system is alive");
  Serial.println("   help       - Show this help message");
  Serial.println();
  Serial.println("Simulation Commands (for testing):");
  Serial.println("   sim0/clear - Simulate 0\" (no water)");
  Serial.println("   sim10/half - Simulate 10\" (half knee)");
  Serial.println("   sim19/knee - Simulate 19\" (knee level)");
  Serial.println("   sim37/waist- Simulate 37\" (waist level)");
  Serial.println("   demo       - Run automatic demo sequence");
}

// Run demo sequence through all water levels
void runDemoSequence() {
  Serial.println("🎬 Demo: Starting at 0 inches...");
  sensor1Triggered = false;
  sensor2Triggered = false;
  sensor3Triggered = false;
  currentWaterLevel = 0.0;
  sendDataToServer();
  delay(3000);

  Serial.println("🎬 Demo: Rising to 10 inches (Flood Watch)...");
  sensor1Triggered = true;
  sensor2Triggered = false;
  sensor3Triggered = false;
  currentWaterLevel = 10.0;
  sendDataToServer();
  delay(3000);

  Serial.println("🎬 Demo: Rising to 19 inches (Flash Flood Alert)...");
  sensor1Triggered = true;
  sensor2Triggered = true;
  sensor3Triggered = false;
  currentWaterLevel = 19.0;
  sendDataToServer();
  delay(3000);

  Serial.println("🎬 Demo: Rising to 37 inches (CRITICAL!)...");
  sensor1Triggered = true;
  sensor2Triggered = true;
  sensor3Triggered = true;
  currentWaterLevel = 37.0;
  sendDataToServer();
  delay(3000);

  Serial.println("🎬 Demo: Water receding to 0 inches...");
  sensor1Triggered = false;
  sensor2Triggered = false;
  sensor3Triggered = false;
  currentWaterLevel = 0.0;
  sendDataToServer();

  Serial.println("✅ Demo sequence complete!");
}

// ========================================
// Utility Functions
// ========================================
String getTimestamp() {
  unsigned long seconds = millis() / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  seconds = seconds % 60;
  minutes = minutes % 60;

  String timestamp = "";
  if (hours < 10) timestamp += "0";
  timestamp += String(hours) + ":";
  if (minutes < 10) timestamp += "0";
  timestamp += String(minutes) + ":";
  if (seconds < 10) timestamp += "0";
  timestamp += String(seconds);

  return timestamp;
}

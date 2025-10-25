/*
 * ════════════════════════════════════════════════════════════════════
 *  AGOS EMERGENCY SMS ALERT SYSTEM - Arduino R4 WiFi + SIM800L
 * ════════════════════════════════════════════════════════════════════
 * 
 * Integrates with AGOS Module 4 Emergency Response System
 * 
 * HARDWARE CONFIGURATION:
 * - Arduino UNO R4 WiFi
 * - SIM800L GSM Module
 *   - RX (SIM800L) → Pin 2 (Arduino)
 *   - TX (SIM800L) → Pin 3 (Arduino)
 *   - GND → GND
 *   - VCC → External 4.2V power supply (NOT Arduino 5V!)
 * 
 * - Water Level Sensors (TSOP38238 + IR LED)
 *   - Sensor 1 (10" Half-knee): A0 + Pin 9
 *   - Sensor 2 (19" Knee): A1 + Pin 10
 *   - Sensor 3 (37" Waist): A3 + Pin 13
 * 
 * FEATURES:
 * 1. Automatic SMS alerts based on water level thresholds
 * 2. Manual SMS sending from AGOS Module 4 web interface
 * 3. Fetches recipient list from AGOS server
 * 4. Reports SMS delivery status back to server
 * 5. Network registration with detailed diagnostics
 * 
 * AUTHOR: AGOS Team
 * DATE: October 2025
 * VERSION: 1.0
 * ════════════════════════════════════════════════════════════════════
 */

#include <SoftwareSerial.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";      // Change to your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Change to your WiFi password

// AGOS Server Configuration
const char* SERVER_HOST = "192.168.1.5";  // Change to your server IP
const int SERVER_PORT = 3000;

// SIM800L Configuration
SoftwareSerial sim800(2, 3); // RX=2, TX=3
bool moduleReady = false;
bool networkRegistered = false;

// Water Level Sensor Pins (from your existing system)
const int NUM_SENSORS = 3;
const int SENSOR_PINS[NUM_SENSORS] = {A0, A1, A3};
const int LED_PINS[NUM_SENSORS] = {9, 10, 13};
const int WATER_LEVELS[NUM_SENSORS] = {10, 19, 37}; // inches

// SMS Recipients Storage
const int MAX_RECIPIENTS = 50;
String recipients[MAX_RECIPIENTS];
int recipientCount = 0;

// Alert Thresholds
const int FLASH_FLOOD_LEVEL = 37;   // 37" = Waist deep
const int FLOOD_WATCH_LEVEL = 19;   // 19" = Knee deep
const int FLOOD_ADVISORY_LEVEL = 10; // 10" = Half-knee

// SMS Alert Status
unsigned long lastAlertTime = 0;
const unsigned long ALERT_COOLDOWN = 300000; // 5 minutes between auto-alerts
int lastAlertLevel = 0;

// Current water level
int currentWaterLevel = 0;
bool sensorWaterDetected[NUM_SENSORS] = {false, false, false};

// WiFi Client
WiFiClient wifi;
HttpClient httpClient = HttpClient(wifi, SERVER_HOST, SERVER_PORT);

// ═══════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  
  Serial.println("\n\n");
  Serial.println("════════════════════════════════════════");
  Serial.println("  AGOS EMERGENCY SMS ALERT SYSTEM");
  Serial.println("  Arduino R4 WiFi + SIM800L");
  Serial.println("════════════════════════════════════════\n");
  
  // Setup sensor pins
  setupSensors();
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize SIM800L
  initializeSIM800L();
  
  // Fetch recipients from server
  fetchRecipients();
  
  // Check for pending SMS commands from server
  checkServerCommands();
  
  Serial.println("\n✅ System Ready!");
  Serial.println("════════════════════════════════════════\n");
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════

void loop() {
  // Read water level sensors
  readSensors();
  
  // Check for automatic alerts
  checkAutoAlerts();
  
  // Check for server commands (Module 4 button press)
  checkServerCommands();
  
  // Send sensor data to server
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) { // Every 5 seconds
    sendSensorData();
    lastUpdate = millis();
  }
  
  delay(1000);
}

// ═══════════════════════════════════════════════════════════════════
// WIFI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void connectWiFi() {
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm\n");
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("   System will continue with limited functionality\n");
  }
}

// ═══════════════════════════════════════════════════════════════════
// SENSOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void setupSensors() {
  Serial.println("🔧 Setting up water level sensors...");
  
  for (int i = 0; i < NUM_SENSORS; i++) {
    pinMode(SENSOR_PINS[i], INPUT);
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
  }
  
  Serial.println("✅ Sensors configured\n");
}

void readSensors() {
  // Read each sensor
  for (int i = 0; i < NUM_SENSORS; i++) {
    digitalWrite(LED_PINS[i], HIGH);
    delay(10);
    int reading = analogRead(SENSOR_PINS[i]);
    digitalWrite(LED_PINS[i], LOW);
    
    // Threshold detection (adjust based on your calibration)
    sensorWaterDetected[i] = (reading < 900); // Water detected if POF signal drops
  }
  
  // Determine water level using Sensor 2-priority logic
  if (sensorWaterDetected[1]) {
    // Sensor 2 (MOST RELIABLE) detects
    if (sensorWaterDetected[0] && sensorWaterDetected[2]) {
      currentWaterLevel = 37; // All 3 validated
    } else {
      currentWaterLevel = 19; // Trust Sensor 2
    }
  } else if (sensorWaterDetected[0]) {
    currentWaterLevel = 10; // Only Sensor 1
  } else {
    currentWaterLevel = 0; // Dry
  }
}

// ═══════════════════════════════════════════════════════════════════
// SIM800L FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void initializeSIM800L() {
  Serial.println("📱 Initializing SIM800L module...");
  
  sim800.begin(9600);
  delay(15000); // Wait for module to power up
  
  // Clear buffer
  while (sim800.available()) sim800.read();
  
  Serial.println("1️⃣  Testing basic communication...");
  if (!sendATCommand("AT", "OK", 10000)) {
    Serial.println("   ❌ Module not responding!");
    Serial.println("   Check: Power supply, Wiring, Antenna");
    return;
  }
  Serial.println("   ✅ Module responding");
  
  Serial.println("2️⃣  Checking SIM card...");
  if (!sendATCommand("AT+CPIN?", "READY", 10000)) {
    Serial.println("   ❌ SIM Card Issue!");
    Serial.println("   Check: SIM inserted, has credit, not locked");
    return;
  }
  Serial.println("   ✅ SIM card ready");
  
  Serial.println("3️⃣  Checking signal strength...");
  checkSignalStrength();
  
  Serial.println("4️⃣  Registering to network...");
  if (manualNetworkSetup()) {
    moduleReady = true;
    networkRegistered = true;
    Serial.println("   ✅ Network registered successfully!");
  } else {
    Serial.println("   ❌ Network registration failed");
    Serial.println("   Move to better signal area and restart");
  }
}

bool manualNetworkSetup() {
  // Set automatic network selection
  if (!sendATCommand("AT+COPS=0", "OK", 30000)) {
    return false;
  }
  
  // Wait for network registration
  unsigned long startTime = millis();
  while (millis() - startTime < 120000) { // 2 minutes timeout
    sim800.println("AT+CREG?");
    delay(3000);
    
    String response = "";
    while (sim800.available()) {
      response += (char)sim800.read();
    }
    
    if (response.indexOf("+CREG: 0,1") >= 0 || response.indexOf("+CREG: 0,5") >= 0) {
      // Registered! Now set SMS text mode
      return sendATCommand("AT+CMGF=1", "OK", 10000);
    }
    
    delay(10000); // Wait 10 seconds before retry
  }
  
  return false;
}

void checkSignalStrength() {
  sim800.println("AT+CSQ");
  delay(3000);
  
  String response = "";
  while (sim800.available()) {
    response += (char)sim800.read();
  }
  
  if (response.indexOf("+CSQ:") >= 0) {
    int start = response.indexOf("+CSQ:") + 6;
    int end = response.indexOf(",", start);
    if (end > start) {
      String csqStr = response.substring(start, end);
      int csq = csqStr.toInt();
      Serial.print("   📶 Signal: ");
      Serial.print(csq);
      if (csq == 99) Serial.println(" - NO SIGNAL ❌");
      else if (csq >= 20) Serial.println(" - Excellent ✅");
      else if (csq >= 15) Serial.println(" - Good ✅");
      else if (csq >= 10) Serial.println(" - Fair ⚠️");
      else Serial.println(" - Poor ⚠️");
    }
  }
}

bool sendATCommand(String cmd, String expected, int timeout) {
  while (sim800.available()) sim800.read(); // Clear buffer
  
  sim800.println(cmd);
  
  unsigned long startTime = millis();
  String response = "";
  
  while (millis() - startTime < timeout) {
    while (sim800.available()) {
      char c = sim800.read();
      if (c > 0) response += c;
    }
    
    if (response.indexOf(expected) >= 0) {
      return true;
    }
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// SMS SENDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

bool sendSMS(String number, String message) {
  if (!moduleReady || !networkRegistered) {
    Serial.println("❌ SMS module not ready!");
    return false;
  }
  
  Serial.println("\n📤 SENDING SMS");
  Serial.println("   To: " + number);
  Serial.println("   Message: " + message);
  
  // Clear buffer
  while (sim800.available()) sim800.read();
  
  // Set text mode
  sim800.println("AT+CMGF=1");
  delay(2000);
  
  // Send recipient
  sim800.println("AT+CMGS=\"" + number + "\"");
  delay(6000); // Wait for prompt
  
  // Check for prompt
  String response = "";
  unsigned long promptStart = millis();
  while (millis() - promptStart < 8000) {
    while (sim800.available()) {
      response += (char)sim800.read();
    }
    if (response.indexOf(">") >= 0) break;
  }
  
  if (response.indexOf(">") < 0) {
    Serial.println("   ❌ No prompt received");
    return false;
  }
  
  // Send message
  sim800.print(message);
  delay(1000);
  
  // Send Ctrl+Z
  sim800.write(0x1A);
  delay(500);
  sim800.write(26);
  
  // Wait for response
  delay(25000);
  
  response = "";
  while (sim800.available()) {
    response += (char)sim800.read();
  }
  
  if (response.indexOf("+CMGS:") >= 0 || response.indexOf("OK") >= 0) {
    Serial.println("   ✅ SMS sent successfully!\n");
    return true;
  } else {
    Serial.println("   ❌ SMS failed\n");
    return false;
  }
}

void broadcastSMS(String message, String alertType) {
  if (recipientCount == 0) {
    Serial.println("⚠️  No recipients configured!");
    return;
  }
  
  Serial.println("\n🚨 BROADCASTING EMERGENCY ALERT");
  Serial.println("════════════════════════════════════════");
  Serial.println("Alert Type: " + alertType);
  Serial.println("Recipients: " + String(recipientCount));
  Serial.println("Message: " + message);
  Serial.println("════════════════════════════════════════\n");
  
  int successCount = 0;
  int failCount = 0;
  
  for (int i = 0; i < recipientCount; i++) {
    Serial.print("📱 Sending to: ");
    Serial.println(recipients[i]);
    
    if (sendSMS(recipients[i], message)) {
      successCount++;
    } else {
      failCount++;
    }
    
    delay(5000); // Wait between messages to avoid network congestion
  }
  
  Serial.println("\n════════════════════════════════════════");
  Serial.println("📊 BROADCAST COMPLETE");
  Serial.println("   ✅ Sent: " + String(successCount));
  Serial.println("   ❌ Failed: " + String(failCount));
  Serial.println("════════════════════════════════════════\n");
  
  // Report results to server
  reportSMSResults(alertType, successCount, failCount);
}

// ═══════════════════════════════════════════════════════════════════
// AUTO ALERT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void checkAutoAlerts() {
  // Check if enough time has passed since last alert
  if (millis() - lastAlertTime < ALERT_COOLDOWN) {
    return;
  }
  
  // Check if water level requires alert
  String alertMessage = "";
  String alertType = "";
  
  if (currentWaterLevel >= FLASH_FLOOD_LEVEL && lastAlertLevel < FLASH_FLOOD_LEVEL) {
    alertMessage = "🚨 FLASH FLOOD ALERT! Water level: 37\" (WAIST DEEP). EVACUATE IMMEDIATELY! Stay safe. - AGOS";
    alertType = "flash-flood";
  }
  else if (currentWaterLevel >= FLOOD_WATCH_LEVEL && lastAlertLevel < FLOOD_WATCH_LEVEL) {
    alertMessage = "⚠️ FLOOD WATCH: Water level: 19\" (KNEE DEEP). Prepare to evacuate. Monitor updates. - AGOS";
    alertType = "flood-watch";
  }
  else if (currentWaterLevel >= FLOOD_ADVISORY_LEVEL && lastAlertLevel < FLOOD_ADVISORY_LEVEL) {
    alertMessage = "ℹ️ FLOOD ADVISORY: Water level: 10\" detected. Stay alert and monitor conditions. - AGOS";
    alertType = "weather-update";
  }
  else if (currentWaterLevel == 0 && lastAlertLevel > 0) {
    alertMessage = "✅ ALL CLEAR: Water level has receded. Threat passed. Stay vigilant. - AGOS";
    alertType = "all-clear";
  }
  
  if (alertMessage != "") {
    broadcastSMS(alertMessage, alertType);
    lastAlertTime = millis();
    lastAlertLevel = currentWaterLevel;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SERVER COMMUNICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

void fetchRecipients() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi not connected, using default recipient");
    recipients[0] = "+639691467590"; // Your default number
    recipientCount = 1;
    return;
  }
  
  Serial.println("📥 Fetching recipients from AGOS server...");
  
  httpClient.get("/api/sms-recipients");
  
  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();
  
  if (statusCode == 200) {
    Serial.println("✅ Recipients received");
    parseRecipients(response);
  } else {
    Serial.println("❌ Failed to fetch recipients");
    Serial.println("   Using default recipient");
    recipients[0] = "+639691467590";
    recipientCount = 1;
  }
}

void parseRecipients(String json) {
  // Simple JSON parsing for recipients array
  // Format: {"success":true,"recipients":["+639123456789","+639987654321"]}
  
  int startPos = json.indexOf("[");
  int endPos = json.indexOf("]");
  
  if (startPos == -1 || endPos == -1) {
    recipientCount = 0;
    return;
  }
  
  String recipientsStr = json.substring(startPos + 1, endPos);
  recipientCount = 0;
  
  int pos = 0;
  while (pos < recipientsStr.length() && recipientCount < MAX_RECIPIENTS) {
    int start = recipientsStr.indexOf("\"", pos);
    if (start == -1) break;
    
    int end = recipientsStr.indexOf("\"", start + 1);
    if (end == -1) break;
    
    recipients[recipientCount] = recipientsStr.substring(start + 1, end);
    recipientCount++;
    pos = end + 1;
  }
  
  Serial.print("   Loaded ");
  Serial.print(recipientCount);
  Serial.println(" recipients");
}

void checkServerCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  httpClient.get("/api/sms-command");
  
  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();
  
  if (statusCode == 200 && response.length() > 10) {
    // Parse command from server
    // Format: {"command":"send","alertType":"flash-flood","message":"..."}
    
    if (response.indexOf("\"command\":\"send\"") >= 0) {
      Serial.println("\n📨 SMS Command received from Module 4!");
      
      // Extract alert type
      int typeStart = response.indexOf("\"alertType\":\"") + 13;
      int typeEnd = response.indexOf("\"", typeStart);
      String alertType = response.substring(typeStart, typeEnd);
      
      // Extract message
      int msgStart = response.indexOf("\"message\":\"") + 11;
      int msgEnd = response.indexOf("\"", msgStart);
      String message = response.substring(msgStart, msgEnd);
      
      // Refresh recipients
      fetchRecipients();
      
      // Send broadcast
      broadcastSMS(message, alertType);
    }
  }
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  String jsonData = "{";
  jsonData += "\"waterLevel\":" + String(currentWaterLevel) + ",";
  jsonData += "\"sensor1\":" + String(sensorWaterDetected[0] ? "true" : "false") + ",";
  jsonData += "\"sensor2\":" + String(sensorWaterDetected[1] ? "true" : "false") + ",";
  jsonData += "\"sensor3\":" + String(sensorWaterDetected[2] ? "true" : "false") + ",";
  jsonData += "\"smsReady\":" + String(moduleReady ? "true" : "false") + ",";
  jsonData += "\"networkRegistered\":" + String(networkRegistered ? "true" : "false");
  jsonData += "}";
  
  httpClient.beginRequest();
  httpClient.post("/api/arduino-data");
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonData.length());
  httpClient.beginBody();
  httpClient.print(jsonData);
  httpClient.endRequest();
}

void reportSMSResults(String alertType, int success, int failed) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  String jsonData = "{";
  jsonData += "\"alertType\":\"" + alertType + "\",";
  jsonData += "\"successCount\":" + String(success) + ",";
  jsonData += "\"failedCount\":" + String(failed) + ",";
  jsonData += "\"timestamp\":\"" + String(millis()) + "\"";
  jsonData += "}";
  
  httpClient.beginRequest();
  httpClient.post("/api/sms-status");
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonData.length());
  httpClient.beginBody();
  httpClient.print(jsonData);
  httpClient.endRequest();
}

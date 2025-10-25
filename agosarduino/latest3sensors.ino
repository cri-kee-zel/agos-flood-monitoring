/*Step 1: Power Connections
1. Connect Arduino 5V → Breadboard positive rail (RED)
2. Connect Arduino GND → Breadboard negative rail (BLACK)
3. Verify with multimeter: 5.0V between rails

Step 2: TSOP38238 Installation
Wiring:
1. Pin 1 → Breadboard VCC
2. Pin 2 → Breadboard GND
3. Pin 3 → Arduino A0 (GREEN) + 10kΩ to 5V rail
4. Add 100nF capacitor between Pin 2 and 5v rail or Add 100nF capacitor between Pin 1 and GND rail

Step 3: IR LED Circuit
IR LED Identification:
- LONG LEG = ANODE (+)
- SHORT LEG = CATHODE (-)
- Usually DARK BLUE or CLEAR package

OPTICAL ALIGNMENT:
IR LED ↗↗↗↗↗↗↗ 3.5mm gap ↗↗↗↗↗↗↗ TSOP38238
       ←--- EMITTER ---→ ←-- RECEIVER --→

// ULN2803 CORRECT WIRING:
// 5V → 220 → IR LED ANODE (long leg) → IR LED CATHODE (short leg) → ULN2803 Pin 18 (OUT1)
// ULN2803 Pin 1 (IN1) → Arduino Pin 9
// ULN2803 Pin 9 → GND
// ULN2803 Pin 10 (COM) → Leave OPEN or connect to 5V]

Connect ACROSS the IR LED:
One end → IR LED ANODE (the point between 470Ω and LED)
Other end → IR LED CATHODE (the point between LED and ULN2803)

This creates a "shunt" path for static electricity.

"Parallel to LED" means connect ACROSS the LED but in REVERSE:

Connect:
- 1N4148 CATHODE (striped end) → IR LED ANODE
- 1N4148 ANODE (no stripe) → IR LED CATHODE

This allows current to bypass the LED if voltage is applied backwards.

// CORRECTED PIN ASSIGNMENT - Separate PWM pins
Sensor 1: Pin 9  → ULN2803 Pin 1  → IR LED 1
Sensor 2: Pin 10 → ULN2803 Pin 2  → IR LED 2
Sensor 3: Pin 11 → ULN2803 Pin 3  → IR LED 3

// ULN2803 Pin 9 → GND (common ground)
// ULN2803 Pin 10 → Leave OPEN


*/

//half knee level = 10 inches, sensor 1, A0 pin
// knee level = 19 inches, sensor 2, A1 pin
//waist level = 37 inches, sensor 3, A2 pin


/*
c - Calibrate specific sensor (with auto-save)
a - Auto-calibrate specific sensor (30s learning)
s - Professional dashboard
r - Raw signal readings
d - Detection status
e - Erase all calibrations
? - Help
*/


/*Step 1: Power Connections
1. Connect Arduino 5V → Breadboard positive rail (RED)
2. Connect Arduino GND → Breadboard negative rail (BLACK)
3. Verify with multimeter: 5.0V between rails

Step 2: TSOP38238 Installation
Wiring:
1. Pin 1 → Breadboard VCC
2. Pin 2 → Breadboard GND
3. Pin 3 → Arduino A0 (GREEN) + 10kΩ to 5V rail
4. Add 100nF capacitor between Pin 2 and 5v rail or Add 100nF capacitor between Pin 1 and GND rail

Step 3: IR LED Circuit
IR LED Identification:
- LONG LEG = ANODE (+)
- SHORT LEG = CATHODE (-)
- Usually DARK BLUE or CLEAR package

OPTICAL ALIGNMENT:
IR LED ↗↗↗↗↗↗↗ 3.5mm gap ↗↗↗↗↗↗↗ TSOP38238
       ←--- EMITTER ---→ ←-- RECEIVER --→

// ULN2803 CORRECT WIRING:
// 5V → 220 → IR LED ANODE (long leg) → IR LED CATHODE (short leg) → ULN2803 Pin 18 (OUT1)
// ULN2803 Pin 1 (IN1) → Arduino Pin 9
// ULN2803 Pin 9 → GND
// ULN2803 Pin 10 (COM) → Leave OPEN or connect to 5V]

Connect ACROSS the IR LED:
One end → IR LED ANODE (the point between 470Ω and LED)
Other end → IR LED CATHODE (the point between LED and ULN2803)

This creates a "shunt" path for static electricity.

"Parallel to LED" means connect ACROSS the LED but in REVERSE:

Connect:
- 1N4148 CATHODE (striped end) → IR LED ANODE
- 1N4148 ANODE (no stripe) → IR LED CATHODE

This allows current to bypass the LED if voltage is applied backwards.

// CORRECTED PIN ASSIGNMENT - Separate PWM pins
Sensor 1: Pin 9  → ULN2803 Pin 1  → IR LED 1
Sensor 2: Pin 10 → ULN2803 Pin 2  → IR LED 2
Sensor 3: Pin 11 → ULN2803 Pin 3  → IR LED 3

// ULN2803 Pin 9 → GND (common ground)
// ULN2803 Pin 10 → Leave OPEN


*/

//half knee level = 10 inches, sensor 1, A0 pin
// knee level = 19 inches, sensor 2, A1 pin
//waist level = 37 inches, sensor 3, A2 pin


/*
c - Calibrate specific sensor (with auto-save)
a - Auto-calibrate specific sensor (30s learning)
s - Professional dashboard
r - Raw signal readings
d - Detection status
e - Erase all calibrations
? - Help
*/


/*
🎓 3-SENSOR WATER LEVEL SYSTEM WITH SEPARATE PINS - FIXED VERSION
Addressing A2/A3 pin differences and EEPROM issues
*/

#include <EEPROM.h>

// ============================================================================
// 🎯 3-SENSOR CONFIGURATION - CORRECTED PIN ASSIGNMENTS
// ============================================================================

#define NUM_SENSORS 3
#define NUM_READINGS 50

struct SensorConfig {
  int tsopPin;           // TSOP38238 output pin
  int ulnPin;            // ULN2803 control pin
  String location;       // Physical location
  float heightInches;    // Height from base
  int eepromAddress;     // Individual calibration storage
};

// ✅ CORRECTED PIN ASSIGNMENTS - A2 INSTEAD OF A3
SensorConfig sensors[NUM_SENSORS] = {
  {A0, 9,  "HALF_KNEE", 10.0, 0},     // Sensor 1: A0 + Pin 9
  {A1, 10, "KNEE",      19.0, 100},   // Sensor 2: A1 + Pin 10
  {A2, 11, "WAIST",     37.0, 200}    // Sensor 3: A2 + Pin 11 (FIXED: A2 not A3)
};

// ============================================================================
// 🔧 AUTO-SAVE CALIBRATION DATA
// ============================================================================

struct CalibrationData {
  int dryBaseline;
  int wetBaseline;
  int detectionThreshold;
  bool isCalibrated;
  bool signalInverted;
  uint16_t checksum;
};

CalibrationData sensorCals[NUM_SENSORS];
bool sensorsCalibrated[NUM_SENSORS] = {false, false, false};

// ============================================================================
// 🚀 SYSTEM STATE
// ============================================================================

enum SystemMode {
  MODE_DETECTION,
  MODE_CALIBRATION_SINGLE,
  MODE_CALIBRATION_AUTO
};

SystemMode currentMode = MODE_DETECTION;
int currentCalibrationSensor = 0;

bool needsSave[NUM_SENSORS] = {false, false, false};
unsigned long lastSaveTime[NUM_SENSORS] = {0, 0, 0};

unsigned long detectionTimes[NUM_SENSORS] = {0, 0, 0};
int currentSignals[NUM_SENSORS] = {0, 0, 0};
bool waterStates[NUM_SENSORS] = {false, false, false};
unsigned long experimentStartTime = 0;

// ============================================================================
// 📊 SETUP - CORRECTED PIN INITIALIZATION
// ============================================================================

void setup() {
  Serial.begin(115200);

  // ✅ PROPER PIN INITIALIZATION FOR ALL SENSORS
  for(int i = 0; i < NUM_SENSORS; i++) {
    pinMode(sensors[i].tsopPin, INPUT);

    // 🔥 CRITICAL FIX: Enable pull-up for ALL analog pins
    digitalWrite(sensors[i].tsopPin, HIGH); // Enable internal pull-up

    pinMode(sensors[i].ulnPin, OUTPUT);
    digitalWrite(sensors[i].ulnPin, LOW);
  }

  // AUTO-LOAD all calibrations
  loadAllCalibrations();

  experimentStartTime = millis();

  Serial.println("\n🚀 3-SENSOR SYSTEM - FIXED VERSION");
  Serial.println("=================================");
  Serial.println("✅ A2 Pin Fixed • Pull-ups Enabled • EEPROM Spacing Fixed");

  displaySystemStatus();
  displayPinConfiguration();

  Serial.println("\n📊 STARTING DETECTION...");
}

void loadAllCalibrations() {
  int calibratedCount = 0;

  for(int i = 0; i < NUM_SENSORS; i++) {
    EEPROM.get(sensors[i].eepromAddress, sensorCals[i]);

    uint16_t storedChecksum = sensorCals[i].checksum;
    sensorCals[i].checksum = 0;
    uint16_t calculatedChecksum = calculateChecksum(&sensorCals[i]);

    if(sensorCals[i].isCalibrated && storedChecksum == calculatedChecksum) {
      sensorsCalibrated[i] = true;
      calibratedCount++;
      Serial.print("✅ ");
      Serial.print(sensors[i].location);
      Serial.print(" - Loaded from EEPROM addr ");
      Serial.println(sensors[i].eepromAddress);
    } else {
      sensorsCalibrated[i] = false;
      sensorCals[i].isCalibrated = false;
      Serial.print("❌ ");
      Serial.print(sensors[i].location);
      Serial.println(" - No valid calibration");
    }
  }

  Serial.print("\n📋 Load Summary: ");
  Serial.print(calibratedCount);
  Serial.print("/");
  Serial.print(NUM_SENSORS);
  Serial.println(" sensors ready");
}

void displayPinConfiguration() {
  Serial.println("\n🔌 PIN CONFIGURATION (FIXED):");
  Serial.println("============================");
  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print("• ");
    Serial.print(sensors[i].location);
    Serial.print(": TSOP=A");
    Serial.print(sensors[i].tsopPin - A0);
    Serial.print(" | IR=PWM");
    Serial.print(sensors[i].ulnPin);
    Serial.print(" | EEPROM=");
    Serial.println(sensors[i].eepromAddress);
  }
  Serial.println("✅ A2 pin fixed with proper pull-up");
  Serial.println("✅ EEPROM addresses spaced by 100 bytes");
}

// ============================================================================
// 🔄 MAIN LOOP
// ============================================================================

void loop() {
  switch(currentMode) {
    case MODE_DETECTION:
      runThreeSensorDetection();
      for(int i = 0; i < NUM_SENSORS; i++) {
        checkAutoSave(i);
      }
      break;

    case MODE_CALIBRATION_SINGLE:
      runSingleCalibration();
      break;

    case MODE_CALIBRATION_AUTO:
      runAutoCalibration();
      break;
  }

  checkSerialCommands();
  delay(100);
}

// ============================================================================
// 🔍 3-SENSOR DETECTION WITH PIN-SPECIFIC FIXES
// ============================================================================

void runThreeSensorDetection() {
  static unsigned long lastSensorRead = 0;
  static int currentSensor = 0;

  if(millis() - lastSensorRead > 200) {
    readSingleSensor(currentSensor);
    currentSensor = (currentSensor + 1) % NUM_SENSORS;
    lastSensorRead = millis();
  }

  static unsigned long lastDashboard = 0;
  if(millis() - lastDashboard > 3000) {
    displayProfessionalDashboard();
    lastDashboard = millis();
  }
}

void readSingleSensor(int sensorIndex) {
  int signal = measureSignalStrength(sensorIndex);
  currentSignals[sensorIndex] = signal;
  bool waterDetected = detectWater(sensorIndex, signal);

  static unsigned long lastDetectionTime[NUM_SENSORS] = {0, 0, 0};

  if(waterDetected && !waterStates[sensorIndex]) {
    if(millis() - lastDetectionTime[sensorIndex] > 1000) {
      waterStates[sensorIndex] = true;
      detectionTimes[sensorIndex] = millis() - experimentStartTime;
      lastDetectionTime[sensorIndex] = millis();

      Serial.print("💧 WATER at ");
      Serial.print(sensors[sensorIndex].location);
      Serial.print(" (Signal: ");
      Serial.print(signal);
      Serial.print("/");
      Serial.print(NUM_READINGS);
      Serial.print(") at ");
      Serial.print(detectionTimes[sensorIndex] / 1000.0, 1);
      Serial.println("s");
    }
  } else if(!waterDetected && waterStates[sensorIndex]) {
    waterStates[sensorIndex] = false;
    lastDetectionTime[sensorIndex] = millis();
  }
}

// ============================================================================
// 💡 MEASUREMENT FUNCTIONS - WITH PIN-SPECIFIC DEBUGGING
// ============================================================================

int measureSignalStrength(int sensorIndex) {
  int detectedCount = 0;

  // 🔥 ADDED DEBUG OUTPUT FOR SENSOR 3
  bool debugSensor3 = (sensorIndex == 2);

  for (int i = 0; i < NUM_READINGS; i++) {
    generate38kHz(sensorIndex, 10);

    // ✅ PROPER DIGITAL READ WITH PULL-UP
    int reading = digitalRead(sensors[sensorIndex].tsopPin);

    if (debugSensor3 && i == 0) {
      Serial.print("🔍 SENSOR3 DEBUG - Pin A2 reading: ");
      Serial.println(reading);
    }

    if (reading == 0) {
      detectedCount++;
    }
    delayMicroseconds(500);
  }

  if (debugSensor3) {
    Serial.print("🔍 SENSOR3 TOTAL: ");
    Serial.print(detectedCount);
    Serial.print("/");
    Serial.println(NUM_READINGS);
  }

  return detectedCount;
}

void generate38kHz(int sensorIndex, int duration) {
  unsigned long startTime = millis();
  int ulnPin = sensors[sensorIndex].ulnPin;

  while (millis() - startTime < duration) {
    digitalWrite(ulnPin, HIGH);
    delayMicroseconds(13);
    digitalWrite(ulnPin, LOW);
    delayMicroseconds(13);
  }
}

bool detectWater(int sensorIndex, int signal) {
  if (!sensorsCalibrated[sensorIndex]) {
    return (signal > 20);
  }

  if (sensorCals[sensorIndex].signalInverted) {
    return (signal > sensorCals[sensorIndex].detectionThreshold);
  } else {
    return (signal < sensorCals[sensorIndex].detectionThreshold);
  }
}

// ============================================================================
// 💾 AUTO-SAVE SYSTEM - WITH BETTER EEPROM MANAGEMENT
// ============================================================================

void checkAutoSave(int sensorIndex) {
  if (needsSave[sensorIndex] && (millis() - lastSaveTime[sensorIndex] > 30000)) {
    saveSensorCalibration(sensorIndex);
    needsSave[sensorIndex] = false;
    Serial.print("💾 AUTO-SAVED ");
    Serial.print(sensors[sensorIndex].location);
    Serial.print(" to EEPROM addr ");
    Serial.println(sensors[sensorIndex].eepromAddress);
  }
}

uint16_t calculateChecksum(CalibrationData* cal) {
  uint16_t sum = 0;
  uint8_t* data = (uint8_t*)cal;

  for (size_t i = 0; i < sizeof(CalibrationData) - sizeof(cal->checksum); i++) {
    sum += data[i];
  }
  return sum;
}

void saveSensorCalibration(int sensorIndex) {
  sensorCals[sensorIndex].isCalibrated = true;
  sensorsCalibrated[sensorIndex] = true;

  // Calculate checksum
  sensorCals[sensorIndex].checksum = 0;
  sensorCals[sensorIndex].checksum = calculateChecksum(&sensorCals[sensorIndex]);

  // Save with verification
  EEPROM.put(sensors[sensorIndex].eepromAddress, sensorCals[sensorIndex]);

  // Verify the save
  CalibrationData verifyData;
  EEPROM.get(sensors[sensorIndex].eepromAddress, verifyData);

  Serial.print("💾 ");
  Serial.print(sensors[sensorIndex].location);
  Serial.print(" saved to EEPROM addr ");
  Serial.println(sensors[sensorIndex].eepromAddress);

  if (verifyData.checksum == sensorCals[sensorIndex].checksum) {
    Serial.println("✅ EEPROM verification PASSED");
  } else {
    Serial.println("❌ EEPROM verification FAILED");
  }
}

// ============================================================================
// 🧠 AUTO-CALIBRATION - WITH SENSOR 3 SPECIFIC DEBUGGING
// ============================================================================

void startAutoCalibration() {
  Serial.println("\n🧠 AUTO-CALIBRATION MODE");
  Serial.println("Select sensor to auto-calibrate:");

  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print(" ");
    Serial.print(i);
    Serial.print(" - ");
    Serial.print(sensors[i].location);
    Serial.print(sensorsCalibrated[i] ? " [CALIBRATED]" : " [NOT CALIBRATED]");
    Serial.println();
  }

  Serial.println(" x - Cancel");
  currentMode = MODE_CALIBRATION_AUTO;
}

void runAutoCalibration() {
  static bool waitingForSensorSelect = true;
  static bool initialized = false;

  // Reset state when first entering this mode
  if (!initialized) {
    waitingForSensorSelect = true;
    initialized = true;
  }

  if(waitingForSensorSelect && Serial.available()) {
    char input = Serial.read();
    if(input >= '0' && input <= '2') {
      currentCalibrationSensor = input - '0';
      waitingForSensorSelect = false;
      initialized = false; // Reset for next time
      startAutoCalibrationProcess(currentCalibrationSensor);
    } else if(input == 'x') {
      currentMode = MODE_DETECTION;
      waitingForSensorSelect = true; // Reset state
      initialized = false; // Reset for next time
      Serial.println("❌ Auto-calibration cancelled");
    }
    return;
  }
}

void startAutoCalibrationProcess(int sensorIndex) {
  Serial.println("\n🔧 AUTO-CALIBRATING: " + sensors[sensorIndex].location);

  // 🔥 SPECIAL MESSAGE FOR SENSOR 3
  if (sensorIndex == 2) {
    Serial.println("⚠️  SENSOR 3 (A2) - Ensure proper pull-up and signal levels");
  }

  Serial.println("Learning from 30 seconds of usage...");
  Serial.println("1. Keep sensor in AIR for 15 seconds");
  Serial.println("2. Then put in WATER for 15 seconds");
  Serial.println();
  Serial.println("🔄 Starting in 3 seconds...");
  delay(3000);

  runAutoCalibrationForSensor(sensorIndex);
}

void runAutoCalibrationForSensor(int sensorIndex) {
  int airReadings[50] = {0};
  int waterReadings[50] = {0};
  int airIndex = 0, waterIndex = 0;

  Serial.println("📊 Phase 1: Learning AIR pattern (15 seconds)...");
  unsigned long airStart = millis();

  while (millis() - airStart < 15000 && airIndex < 50) {
    airReadings[airIndex] = measureSignalStrength(sensorIndex);

    // 🔥 EXTRA DEBUG FOR SENSOR 3
    if (sensorIndex == 2) {
      Serial.print("🔍 S3-AIR: ");
      Serial.print(airReadings[airIndex]);
      Serial.print("/");
      Serial.print(NUM_READINGS);
      Serial.print(" (sample ");
      Serial.print(airIndex);
      Serial.println(")");
    }

    airIndex++;
    delay(300);
  }

  Serial.println("💧 Phase 2: Learning WATER pattern (15 seconds)...");
  Serial.println("   Put sensor in WATER now!");
  delay(3000);

  unsigned long waterStart = millis();

  while (millis() - waterStart < 15000 && waterIndex < 50) {
    waterReadings[waterIndex] = measureSignalStrength(sensorIndex);

    // 🔥 EXTRA DEBUG FOR SENSOR 3
    if (sensorIndex == 2) {
      Serial.print("🔍 S3-WATER: ");
      Serial.print(waterReadings[waterIndex]);
      Serial.print("/");
      Serial.print(NUM_READINGS);
      Serial.print(" (sample ");
      Serial.print(waterIndex);
      Serial.println(")");
    }

    waterIndex++;
    delay(300);
  }

  // Calculate averages
  sensorCals[sensorIndex].dryBaseline = calculateAverage(airReadings, airIndex);
  sensorCals[sensorIndex].wetBaseline = calculateAverage(waterReadings, waterIndex);

  // Auto-detect signal type
  if(sensorCals[sensorIndex].dryBaseline < sensorCals[sensorIndex].wetBaseline) {
    sensorCals[sensorIndex].signalInverted = true;
    sensorCals[sensorIndex].detectionThreshold =
      (sensorCals[sensorIndex].dryBaseline + sensorCals[sensorIndex].wetBaseline) / 2;
    Serial.println("🔁 INVERTED signal detected");
  } else {
    sensorCals[sensorIndex].signalInverted = false;
    sensorCals[sensorIndex].detectionThreshold =
      (sensorCals[sensorIndex].dryBaseline + sensorCals[sensorIndex].wetBaseline) / 2;
    Serial.println("✅ NORMAL signal detected");
  }

  Serial.println("✅ AUTO-CALIBRATION COMPLETE!");
  displayCalibrationSummary(sensorIndex);

  // AUTO-SAVE TO EEPROM
  saveSensorCalibration(sensorIndex);
  currentMode = MODE_DETECTION;

  Serial.println("🔁 Returning to detection mode...");
}

// ============================================================================
// 📊 PROFESSIONAL DASHBOARD - WITH EEPROM INFO
// ============================================================================

void displayProfessionalDashboard() {
  Serial.println();
  Serial.println("┌─────────────────────────────────────────────────────────┐");
  Serial.println("│          3-SENSOR WATER DETECTION - FIXED VERSION      │");
  Serial.println("├─────────────────────────────────────────────────────────┤");

  Serial.println("│ SENSOR      │ STATUS  │ SIGNAL │ THRESH  │ CALIB │ EEPROM│");
  Serial.println("├─────────────┼─────────┼────────┼─────────┼───────┼───────┤");

  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print("│ ");
    Serial.print(sensors[i].location);
    for(int s = sensors[i].location.length(); s < 11; s++) Serial.print(" ");

    Serial.print("│ ");
    Serial.print(waterStates[i] ? "💧 WET  " : "💨 DRY  ");

    Serial.print("│ ");
    Serial.print(currentSignals[i]);
    Serial.print("/");
    Serial.print(NUM_READINGS);
    for(int s = String(currentSignals[i]).length() + String(NUM_READINGS).length() + 1; s < 8; s++) Serial.print(" ");

    Serial.print("│ ");
    if(sensorsCalibrated[i]) {
      Serial.print(sensorCals[i].detectionThreshold);
      for(int s = String(sensorCals[i].detectionThreshold).length(); s < 7; s++) Serial.print(" ");
    } else {
      Serial.print("N/C    ");
    }

    Serial.print("│ ");
    Serial.print(sensorsCalibrated[i] ? " ✅  " : " ❌  ");

    Serial.print("│ ");
    Serial.print(sensors[i].eepromAddress);
    Serial.println(" │");
  }

  Serial.println("└─────────────────────────────────────────────────────────┘");
}

// ============================================================================
// 📡 SERIAL COMMANDS - WITH DIAGNOSTICS
// ============================================================================

void checkSerialCommands() {
  if(Serial.available()) {
    char command = Serial.read();

    switch(command) {
      case 'c':
        if(currentMode == MODE_DETECTION) startManualCalibration();
        break;

      case 'a':
        if(currentMode == MODE_DETECTION) startAutoCalibration();
        break;

      case 's':
        displayProfessionalDashboard();
        break;

      case 'r':
        displayRawSignals();
        break;

      case 'd':
        displayDetectionStatus();
        break;

      case 'e':
        eraseAllCalibrations();
        break;

      case '?':
        displayEnhancedHelp();
        break;

      case 't': // 🔥 NEW: Test sensor 3 specifically
        testSensor3();
        break;
    }
  }
}

// 🔥 NEW FUNCTION: SPECIFIC SENSOR 3 TESTING
void testSensor3() {
  Serial.println("\n🔧 SENSOR 3 DIAGNOSTIC TEST");
  Serial.println("==========================");
  Serial.println("Testing A2 pin with 10 rapid measurements...");

  for(int i = 0; i < 10; i++) {
    int signal = measureSignalStrength(2);
    Serial.print("Test ");
    Serial.print(i);
    Serial.print(": ");
    Serial.print(signal);
    Serial.print("/");
    Serial.print(NUM_READINGS);
    Serial.print(" | Pin A2 reading: ");
    Serial.println(digitalRead(A2));
    delay(500);
  }
}

void displayRawSignals() {
  Serial.println("\n📡 CURRENT SIGNAL READINGS:");
  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print(sensors[i].location);
    Serial.print(" (A");
    Serial.print(sensors[i].tsopPin - A0);
    Serial.print("): ");
    Serial.print(currentSignals[i]);
    Serial.print("/");
    Serial.print(NUM_READINGS);

    if(sensorsCalibrated[i]) {
      bool shouldBeWater = sensorCals[i].signalInverted ?
        (currentSignals[i] > sensorCals[i].detectionThreshold) :
        (currentSignals[i] < sensorCals[i].detectionThreshold);

      Serial.print(shouldBeWater ? " [WATER💧]" : " [AIR💨]");
    }
    Serial.println();
  }
}

void eraseAllCalibrations() {
  for(int i = 0; i < NUM_SENSORS; i++) {
    sensorsCalibrated[i] = false;
    sensorCals[i].isCalibrated = false;
    EEPROM.put(sensors[i].eepromAddress, sensorCals[i]);
    needsSave[i] = false;
  }
  Serial.println("🗑️  All calibrations erased from EEPROM!");
}

void displayEnhancedHelp() {
  Serial.println("\n🎯 ENHANCED COMMANDS:");
  Serial.println("====================");
  Serial.println("c - Manual calibration (auto-saves after 30s)");
  Serial.println("a - Auto-calibration (30s learning + auto-save)");
  Serial.println("s - Professional dashboard");
  Serial.println("r - Raw signal readings");
  Serial.println("d - Detection status");
  Serial.println("e - Erase all calibrations");
  Serial.println("t - Test Sensor 3 specifically");
  Serial.println("? - Show this help");
  Serial.println();
  Serial.println("🔧 FIXES APPLIED:");
  Serial.println("- A2 pin instead of A3");
  Serial.println("- Pull-ups enabled for all analog pins");
  Serial.println("- EEPROM addresses spaced by 100 bytes");
  Serial.println("- Sensor 3 specific debugging");
}

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

int calculateAverage(int* readings, int count) {
  long sum = 0;
  for(int i = 0; i < count; i++) {
    sum += readings[i];
  }
  return count > 0 ? sum / count : 0;
}

// ============================================================================
// 🔧 MANUAL CALIBRATION FUNCTIONS (UNCHANGED BUT INCLUDED FOR COMPLETENESS)
// ============================================================================

void startManualCalibration() {
  Serial.println("\n🎯 MANUAL CALIBRATION MODE");
  Serial.println("Select sensor to calibrate:");

  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print(" ");
    Serial.print(i);
    Serial.print(" - ");
    Serial.print(sensors[i].location);
    Serial.print(sensorsCalibrated[i] ? " [CALIBRATED]" : " [NOT CALIBRATED]");
    Serial.println();
  }

  Serial.println(" x - Cancel");
  currentMode = MODE_CALIBRATION_SINGLE;
}

void runSingleCalibration() {
  static bool waitingForSensorSelect = true;
  static int calibrationStep = 0;
  static bool initialized = false;

  // Reset state when first entering this mode
  if (!initialized) {
    waitingForSensorSelect = true;
    calibrationStep = 0;
    initialized = true;
  }

  if(waitingForSensorSelect && Serial.available()) {
    char input = Serial.read();
    if(input >= '0' && input <= '2') {
      currentCalibrationSensor = input - '0';
      waitingForSensorSelect = false;
      calibrationStep = 1;
      Serial.println("\n🔧 CALIBRATING: " + sensors[currentCalibrationSensor].location);
      Serial.println("Ensure sensor is in AIR and press any key...");
    } else if(input == 'x') {
      currentMode = MODE_DETECTION;
      waitingForSensorSelect = true; // Reset state
      calibrationStep = 0; // Reset step
      initialized = false; // Reset for next time
      Serial.println("❌ Calibration cancelled");
    }
    return;
  }

  if(calibrationStep == 1 && Serial.available()) {
    Serial.read();
    measureDryBaseline(currentCalibrationSensor);
    calibrationStep = 2;
    Serial.println("STEP 2: Submerge sensor in WATER, then press any key");
  }

  if(calibrationStep == 2 && Serial.available()) {
    Serial.read();
    measureWetBaseline(currentCalibrationSensor);
    calibrationStep = 0;
    waitingForSensorSelect = true; // Reset for next calibration
    initialized = false; // Reset for next time
    completeManualCalibration(currentCalibrationSensor);
  }
}

void measureDryBaseline(int sensorIndex) {
  Serial.println("📊 Measuring DRY baseline...");
  delay(1000);

  int readings[10];
  for(int i = 0; i < 10; i++) {
    readings[i] = measureSignalStrength(sensorIndex);
    delay(200);
  }

  sensorCals[sensorIndex].dryBaseline = calculateAverage(readings, 10);
  Serial.print("✅ DRY Baseline: ");
  Serial.println(sensorCals[sensorIndex].dryBaseline);

  needsSave[sensorIndex] = true;
  lastSaveTime[sensorIndex] = millis();
}

void measureWetBaseline(int sensorIndex) {
  Serial.println("📊 Measuring WET baseline...");
  delay(1000);

  int readings[10];
  for(int i = 0; i < 10; i++) {
    readings[i] = measureSignalStrength(sensorIndex);
    delay(200);
  }

  sensorCals[sensorIndex].wetBaseline = calculateAverage(readings, 10);
  Serial.print("✅ WET Baseline: ");
  Serial.println(sensorCals[sensorIndex].wetBaseline);

  if(sensorCals[sensorIndex].dryBaseline < sensorCals[sensorIndex].wetBaseline) {
    sensorCals[sensorIndex].signalInverted = true;
    sensorCals[sensorIndex].detectionThreshold =
      (sensorCals[sensorIndex].dryBaseline + sensorCals[sensorIndex].wetBaseline) / 2;
    Serial.println("🔁 INVERTED signal detected");
  } else {
    sensorCals[sensorIndex].signalInverted = false;
    sensorCals[sensorIndex].detectionThreshold =
      (sensorCals[sensorIndex].dryBaseline + sensorCals[sensorIndex].wetBaseline) / 2;
    Serial.println("✅ NORMAL signal detected");
  }

  Serial.print("🎯 Auto Threshold: ");
  Serial.println(sensorCals[sensorIndex].detectionThreshold);

  int margin = abs(sensorCals[sensorIndex].dryBaseline - sensorCals[sensorIndex].wetBaseline);
  Serial.print("📏 Signal Margin: ");
  Serial.println(margin);

  needsSave[sensorIndex] = true;
  lastSaveTime[sensorIndex] = millis();

  Serial.println("Calibration will auto-save in 30 seconds");
}

void completeManualCalibration(int sensorIndex) {
  displayCalibrationSummary(sensorIndex);
  Serial.println("✅ Manual calibration complete - will auto-save to EEPROM!");
  currentMode = MODE_DETECTION;
}

void displayCalibrationSummary(int sensorIndex) {
  Serial.println();
  Serial.println("📋 CALIBRATION SUMMARY:");
  Serial.println("======================");
  Serial.print(sensors[sensorIndex].location);
  Serial.println(" Sensor:");
  Serial.print("Dry (air):    ");
  Serial.println(sensorCals[sensorIndex].dryBaseline);
  Serial.print("Wet (water):  ");
  Serial.println(sensorCals[sensorIndex].wetBaseline);
  Serial.print("Threshold:    ");
  Serial.println(sensorCals[sensorIndex].detectionThreshold);
  Serial.print("Signal Type:  ");
  Serial.println(sensorCals[sensorIndex].signalInverted ? "INVERTED" : "NORMAL");

  int margin = abs(sensorCals[sensorIndex].dryBaseline - sensorCals[sensorIndex].wetBaseline);
  Serial.print("Signal Margin: ");
  Serial.println(margin);

  if (margin >= 10) {
    Serial.println("✅ EXCELLENT - Strong detection signal");
  } else if (margin >= 5) {
    Serial.println("⚠️  ADEQUATE - Should work reliably");
  } else {
    Serial.println("❌ WEAK - May need better optical alignment");
  }
}

void displaySystemStatus() {
  Serial.println("\n🖥️ SYSTEM STATUS:");
  Serial.println("================");

  int calibratedCount = 0;
  int submergedCount = 0;
  for(int i = 0; i < NUM_SENSORS; i++) {
    if(sensorsCalibrated[i]) calibratedCount++;
    if(waterStates[i]) submergedCount++;
  }

  Serial.print("Calibrated: ");
  Serial.print(calibratedCount);
  Serial.print("/");
  Serial.print(NUM_SENSORS);
  Serial.println(" sensors");

  Serial.print("Submerged: ");
  Serial.print(submergedCount);
  Serial.print("/");
  Serial.print(NUM_SENSORS);
  Serial.println(" levels");

  Serial.print("Experiment: ");
  Serial.print((millis() - experimentStartTime) / 1000.0, 1);
  Serial.println(" seconds");
}

void displayDetectionStatus() {
  Serial.println("\n🔍 DETECTION STATUS:");
  for(int i = 0; i < NUM_SENSORS; i++) {
    Serial.print(sensors[i].location);
    Serial.print(": ");
    Serial.print(waterStates[i] ? "💧 SUBMERGED" : "💨 AIR");

    if(detectionTimes[i] > 0) {
      Serial.print(" (detected at ");
      Serial.print(detectionTimes[i] / 1000.0, 1);
      Serial.print("s)");
    }
    Serial.println();
  }
}


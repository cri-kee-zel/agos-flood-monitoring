/*
🔍 SIMPLE TSOP38238 TEST - YOUR SCHEMATIC
Based on your exact wiring:
- Sensor 1: TSOP at A0, IR LED via Pin 9 → ULN2803 Pin 1
- Sensor 2: TSOP at A1, IR LED via Pin 10 → ULN2803 Pin 2
- Sensor 3: TSOP at A2, IR LED via Pin 11 → ULN2803 Pin 3
- All TSOPs have 10kΩ pull-up to 5V
- ULN2803 Pin 9 → GND
*/

// Define sensors
#define SENSOR1_TSOP A0
#define SENSOR1_LED 9

#define SENSOR2_TSOP A1
#define SENSOR2_LED 10

#define SENSOR3_TSOP A2
#define SENSOR3_LED 11

void setup() {
  // Setup LED pins (to ULN2803)
  pinMode(SENSOR1_LED, OUTPUT);
  pinMode(SENSOR2_LED, OUTPUT);
  pinMode(SENSOR3_LED, OUTPUT);

  // Setup TSOP pins (with external 10kΩ pull-up)
  pinMode(SENSOR1_TSOP, INPUT);
  pinMode(SENSOR2_TSOP, INPUT);
  pinMode(SENSOR3_TSOP, INPUT);

  // All LEDs OFF initially
  digitalWrite(SENSOR1_LED, LOW);
  digitalWrite(SENSOR2_LED, LOW);
  digitalWrite(SENSOR3_LED, LOW);

  Serial.begin(115200);
  Serial.println("\n🎯 SIMPLE TSOP TEST - YOUR SCHEMATIC");
  Serial.println("====================================");
  Serial.println("Testing 3 sensors:");
  Serial.println("  Sensor 1: A0 + Pin 9");
  Serial.println("  Sensor 2: A1 + Pin 10");
  Serial.println("  Sensor 3: A2 + Pin 11");
  Serial.println();
  delay(2000);
}

void loop() {
  Serial.println("\n========== TEST CYCLE ==========");

  // Test Sensor 1
  Serial.println("\n📍 SENSOR 1 (A0 + Pin 9):");
  testSensor(SENSOR1_TSOP, SENSOR1_LED, "Sensor 1");
  delay(500);

  // Test Sensor 2
  Serial.println("\n📍 SENSOR 2 (A1 + Pin 10):");
  testSensor(SENSOR2_TSOP, SENSOR2_LED, "Sensor 2");
  delay(500);

  // Test Sensor 3
  Serial.println("\n📍 SENSOR 3 (A2 + Pin 11):");
  testSensor(SENSOR3_TSOP, SENSOR3_LED, "Sensor 3");
  delay(500);

  Serial.println("\n========== END CYCLE ==========\n");
  delay(2000);
}

void testSensor(int tsopPin, int ledPin, String sensorName) {
  // Step 1: Read baseline (LED OFF)
  digitalWrite(ledPin, LOW);
  delay(50);
  int baseline = digitalRead(tsopPin);
  Serial.print("  LED OFF:  ");
  Serial.print(baseline);
  Serial.println(baseline == HIGH ? " (HIGH - No detection) ✅" : " (LOW - Unexpected!)");

  // Step 2: Turn on 38kHz for 100ms
  Serial.print("  LED ON:   ");
  unsigned long startTime = millis();
  while (millis() - startTime < 100) {
    digitalWrite(ledPin, HIGH);
    delayMicroseconds(13);
    digitalWrite(ledPin, LOW);
    delayMicroseconds(13);
  }

  // Make sure LED is OFF
  digitalWrite(ledPin, LOW);
  delay(10); // AGC recovery

  // Read TSOP during/after IR
  int detected = digitalRead(tsopPin);
  Serial.print(detected);
  Serial.println(detected == LOW ? " (LOW - Detected IR!) ✅" : " (HIGH - No detection)");

  // Step 3: Turn LED OFF and read again
  digitalWrite(ledPin, LOW);
  delay(50);
  int afterOff = digitalRead(tsopPin);
  Serial.print("  After OFF: ");
  Serial.print(afterOff);
  Serial.println(afterOff == HIGH ? " (HIGH - Back to baseline) ✅" : " (LOW - Still detecting?)");

  // Summary
  if(baseline == HIGH && detected == LOW && afterOff == HIGH) {
    Serial.println("  ✅ SENSOR WORKING PERFECTLY!");
  } else if(baseline == LOW && detected == LOW && afterOff == LOW) {
    Serial.println("  ⚠️  SENSOR STUCK LOW (No pull-up or always detecting)");
  } else if(baseline == HIGH && detected == HIGH && afterOff == HIGH) {
    Serial.println("  ❌ NO DETECTION (IR LED not working or not aligned)");
  } else {
    Serial.println("  ⚠️  INCONSISTENT BEHAVIOR");
  }
}

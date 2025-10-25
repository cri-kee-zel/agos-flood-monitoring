/*
 * ════════════════════════════════════════════════════════════════════
 *  SIM800L TEST SKETCH - Simple SMS Test for Arduino R4 WiFi
 * ════════════════════════════════════════════════════════════════════
 *
 * Use this sketch to test your SIM800L module BEFORE full integration
 *
 * WIRING:
 * - SIM800L RX → Arduino Pin 2
 * - SIM800L TX → Arduino Pin 3
 * - SIM800L VCC → 4.2V Power Supply (NOT Arduino 5V!)
 * - SIM800L GND → Common Ground
 * - Antenna attached to SIM800L
 * - SIM card inserted with credit
 *
 * SERIAL COMMANDS:
 * - Type "SMS" to send test SMS to default number
 * - Type "SEND +639123456789 Your message here" to send to specific number
 * - Type "STATUS" to check module status
 * - Type "SIGNAL" to check signal strength
 * - Type "HELP" for all commands
 *
 * ════════════════════════════════════════════════════════════════════
 */

#include <SoftwareSerial.h>

// SIM800L Configuration
SoftwareSerial sim800(2, 3); // RX=2, TX=3

// Default phone number (CHANGE THIS!)
String MY_PHONE_NUMBER = "+639691467590";

bool moduleReady = false;

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  Serial.println("\n\n╔════════════════════════════════════════╗");
  Serial.println("║   SIM800L SMS TEST - Arduino R4      ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  Serial.println("📱 Initializing SIM800L...");
  Serial.println("   Please wait 15 seconds for module to boot...\n");

  sim800.begin(9600);
  delay(15000); // Wait for module to power up

  // Clear buffer
  while(sim800.available()) sim800.read();

  testModule();

  if (moduleReady) {
    Serial.println("\n✅ SIM800L READY FOR TESTING!\n");
    showHelp();
  } else {
    Serial.println("\n❌ SIM800L INITIALIZATION FAILED!");
    Serial.println("   Check: Power, Wiring, SIM card, Antenna\n");
  }
}

void loop() {
  // Check for user commands from Serial Monitor
  if (Serial.available()) {
    String command = Serial.readString();
    command.trim();
    handleCommand(command);
  }

  // Show any responses from SIM800L
  if (sim800.available()) {
    String response = sim800.readString();
    Serial.print("📱 SIM800L: ");
    Serial.println(response);
  }

  delay(100);
}

void testModule() {
  Serial.println("1️⃣  Testing basic communication...");
  if (!sendATCommand("AT", "OK", 10000)) {
    Serial.println("   ❌ Module not responding!");
    Serial.println("   Check: 1. Power supply (4.2V)");
    Serial.println("          2. RX/TX wiring");
    Serial.println("          3. Try swapping RX and TX");
    return;
  }
  Serial.println("   ✅ Module responding\n");

  Serial.println("2️⃣  Checking SIM card...");
  if (!sendATCommand("AT+CPIN?", "READY", 10000)) {
    Serial.println("   ❌ SIM Card Issue!");
    Serial.println("   Check: 1. SIM inserted properly");
    Serial.println("          2. SIM has credit");
    Serial.println("          3. SIM PIN disabled");
    return;
  }
  Serial.println("   ✅ SIM card ready\n");

  Serial.println("3️⃣  Checking signal strength...");
  checkSignal();

  Serial.println("\n4️⃣  Registering to network...");
  Serial.println("   This may take up to 2 minutes...");
  if (registerNetwork()) {
    moduleReady = true;
    Serial.println("   ✅ Network registered!\n");
  } else {
    Serial.println("   ❌ Network registration failed");
    Serial.println("   Try: Move to area with better signal\n");
  }
}

bool registerNetwork() {
  // Set automatic network selection
  sendATCommand("AT+COPS=0", "OK", 30000);

  // Wait for registration
  unsigned long startTime = millis();
  int dots = 0;

  while (millis() - startTime < 120000) { // 2 minutes timeout
    sim800.println("AT+CREG?");
    delay(3000);

    String response = "";
    while (sim800.available()) {
      response += (char)sim800.read();
    }

    // Registered to home network or roaming
    if (response.indexOf("+CREG: 0,1") >= 0 || response.indexOf("+CREG: 0,5") >= 0) {
      Serial.println(" ✅");
      // Set SMS text mode
      delay(2000);
      return sendATCommand("AT+CMGF=1", "OK", 10000);
    }

    // Show progress
    Serial.print(".");
    dots++;
    if (dots % 10 == 0) Serial.print(" ");

    delay(10000); // Wait 10 seconds before retry
  }

  Serial.println(" ❌");
  return false;
}

void checkSignal() {
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

      Serial.print("   📶 Signal Strength: ");
      Serial.print(csq);

      if (csq == 99) {
        Serial.println(" - NO SIGNAL ❌");
        Serial.println("      Action: Move to area with better coverage");
      }
      else if (csq >= 20) {
        Serial.println(" - Excellent ✅");
      }
      else if (csq >= 15) {
        Serial.println(" - Good ✅");
      }
      else if (csq >= 10) {
        Serial.println(" - Fair ⚠️");
      }
      else {
        Serial.println(" - Poor ⚠️");
        Serial.println("      Action: Try moving to window or outdoor");
      }
    }
  } else {
    Serial.println("   ❌ Cannot read signal");
  }
}

bool sendATCommand(String cmd, String expected, int timeout) {
  // Clear buffer
  while(sim800.available()) sim800.read();

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

void handleCommand(String cmd) {
  cmd.toUpperCase();

  if (cmd == "SMS") {
    if (!moduleReady) {
      Serial.println("❌ Module not ready! Run initialization first.");
      return;
    }
    Serial.println("\n📤 Sending test SMS to: " + MY_PHONE_NUMBER);
    sendSMS(MY_PHONE_NUMBER, "Test from AGOS Arduino - " + String(millis()));
  }
  else if (cmd.startsWith("SEND ")) {
    if (!moduleReady) {
      Serial.println("❌ Module not ready!");
      return;
    }

    // Parse: SEND +639123456789 Your message here
    int firstSpace = cmd.indexOf(' ');
    int secondSpace = cmd.indexOf(' ', firstSpace + 1);

    if (secondSpace > 0) {
      String number = cmd.substring(firstSpace + 1, secondSpace);
      String message = cmd.substring(secondSpace + 1);

      Serial.println("\n📤 Sending SMS...");
      Serial.println("   To: " + number);
      Serial.println("   Message: " + message);
      sendSMS(number, message);
    } else {
      Serial.println("❌ Invalid format!");
      Serial.println("   Usage: SEND +639123456789 Your message");
    }
  }
  else if (cmd.startsWith("SETNUM ")) {
    String newNumber = cmd.substring(7);
    MY_PHONE_NUMBER = newNumber;
    Serial.println("✅ Default number set to: " + MY_PHONE_NUMBER);
  }
  else if (cmd == "STATUS") {
    Serial.println("\n═══ MODULE STATUS ═══");
    Serial.println("Module Ready: " + String(moduleReady ? "YES ✅" : "NO ❌"));
    Serial.println("Default Number: " + MY_PHONE_NUMBER);
    Serial.println();
    sendATCommand("AT", "OK", 5000);
    delay(1000);
    checkSignal();
    Serial.println("═══════════════════════\n");
  }
  else if (cmd == "SIGNAL") {
    checkSignal();
  }
  else if (cmd == "NETWORK") {
    Serial.println("\n📡 Checking network registration...");
    sendATCommand("AT+CREG?", "OK", 5000);
    delay(1000);
    sendATCommand("AT+COPS?", "OK", 5000);
  }
  else if (cmd == "RESET") {
    Serial.println("\n🔄 Resetting module...");
    sendATCommand("AT+CFUN=1,1", "OK", 20000);
    delay(20000);
    moduleReady = false;
    testModule();
  }
  else if (cmd == "HELP") {
    showHelp();
  }
  else if (cmd != "") {
    Serial.println("❌ Unknown command: " + cmd);
    Serial.println("   Type HELP for available commands\n");
  }
}

void sendSMS(String number, String message) {
  Serial.println("\n════ SENDING SMS ════");

  // Clear buffer
  while(sim800.available()) sim800.read();

  // Set text mode
  Serial.println("1. Setting text mode...");
  sim800.println("AT+CMGF=1");
  delay(2000);

  // Send recipient
  Serial.println("2. Sending recipient...");
  sim800.println("AT+CMGS=\"" + number + "\"");
  delay(6000);

  // Wait for prompt
  Serial.println("3. Waiting for prompt '>'...");
  String response = "";
  unsigned long startTime = millis();

  while (millis() - startTime < 8000) {
    while (sim800.available()) {
      char c = sim800.read();
      response += c;
      Serial.write(c);
    }
    if (response.indexOf(">") >= 0) {
      Serial.println("\n   ✅ Prompt received!");
      break;
    }
  }

  if (response.indexOf(">") < 0) {
    Serial.println("\n   ❌ No prompt received - aborting");
    Serial.println("════════════════════\n");
    return;
  }

  // Send message
  Serial.println("4. Sending message text...");
  sim800.print(message);
  delay(1000);

  // Send Ctrl+Z to complete
  Serial.println("5. Sending Ctrl+Z...");
  sim800.write(0x1A);
  sim800.write(26);

  // Wait for confirmation
  Serial.println("6. Waiting for confirmation (up to 30 seconds)...");
  delay(30000);

  response = "";
  while (sim800.available()) {
    response += (char)sim800.read();
  }

  Serial.println("\n📱 Network response:");
  Serial.println(response);

  if (response.indexOf("+CMGS:") >= 0) {
    Serial.println("\n🎉 SMS SENT SUCCESSFULLY!");
    Serial.println("   Check your phone now!");
  }
  else if (response.indexOf("OK") >= 0) {
    Serial.println("\n✅ SMS ACCEPTED BY NETWORK");
    Serial.println("   Should be delivered soon");
  }
  else {
    Serial.println("\n❌ SMS FAILED");
    Serial.println("   Check: Signal, Credit, Number format");
  }

  Serial.println("════════════════════\n");
}

void showHelp() {
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║         AVAILABLE COMMANDS           ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println();
  Serial.println("📱 SMS COMMANDS:");
  Serial.println("  SMS");
  Serial.println("    → Send test to default number");
  Serial.println("  SEND +639123456789 Your message here");
  Serial.println("    → Send custom SMS to any number");
  Serial.println("  SETNUM +639123456789");
  Serial.println("    → Change default number");
  Serial.println();
  Serial.println("🔧 DIAGNOSTIC COMMANDS:");
  Serial.println("  STATUS");
  Serial.println("    → Show module status");
  Serial.println("  SIGNAL");
  Serial.println("    → Check signal strength");
  Serial.println("  NETWORK");
  Serial.println("    → Check network registration");
  Serial.println("  RESET");
  Serial.println("    → Reset SIM800L module");
  Serial.println();
  Serial.println("💡 EXAMPLES:");
  Serial.println("  SEND +639123456789 Hello from Arduino!");
  Serial.println("  SEND +639171234567 Water level alert");
  Serial.println();
  Serial.println("📞 Current default: " + MY_PHONE_NUMBER);
  Serial.println("════════════════════════════════════════\n");
}

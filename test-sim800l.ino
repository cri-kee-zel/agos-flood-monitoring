// Simple SIM800L Test Program
// Upload this to test ONLY the SIM800L module

#define SIM800L_TX 8    // Connect to SIM800L RX
#define SIM800L_RX 9    // Connect to SIM800L TX
#define SIM800L_RST 3   // Reset pin for SIM800L

void setup() {
  Serial.begin(115200);
  Serial.println("🧪 SIM800L Test Program");
  Serial.println("========================");

  // Initialize Serial1 for SIM800L
  Serial1.begin(9600);

  // Reset SIM800L
  pinMode(SIM800L_RST, OUTPUT);
  digitalWrite(SIM800L_RST, LOW);
  delay(100);
  digitalWrite(SIM800L_RST, HIGH);
  delay(3000);

  Serial.println("📱 Testing SIM800L...");
  testSIM800L();
}

void loop() {
  // Forward any manual commands from Serial Monitor to SIM800L
  if (Serial.available()) {
    String command = Serial.readString();
    command.trim();
    Serial.println("👤 Sending: " + command);
    Serial1.println(command);
  }

  // Show any response from SIM800L
  if (Serial1.available()) {
    String response = Serial1.readString();
    Serial.print("📱 SIM800L: ");
    Serial.println(response);
  }
}

void testSIM800L() {
  Serial.println("\n1️⃣ Testing AT command...");
  sendATCommand("AT", 2000);

  Serial.println("\n2️⃣ Testing module info...");
  sendATCommand("ATI", 2000);

  Serial.println("\n3️⃣ Testing SIM card...");
  sendATCommand("AT+CPIN?", 2000);

  Serial.println("\n4️⃣ Testing signal strength...");
  sendATCommand("AT+CSQ", 2000);

  Serial.println("\n5️⃣ Testing SMS mode...");
  sendATCommand("AT+CMGF=1", 2000);

  Serial.println("\n✅ Test complete. You can now send manual AT commands.");
  Serial.println("💡 Try typing: AT, ATI, AT+CSQ, AT+CPIN?, etc.");
}

void sendATCommand(String command, int timeout) {
  Serial.print("📤 Sending: ");
  Serial.println(command);

  Serial1.println(command);

  unsigned long start = millis();
  String response = "";

  while (millis() - start < timeout) {
    if (Serial1.available()) {
      response += Serial1.readString();
    }
    delay(10);
  }

  if (response.length() > 0) {
    Serial.print("📥 Response: ");
    Serial.println(response);
  } else {
    Serial.println("❌ No response (timeout)");
  }
}
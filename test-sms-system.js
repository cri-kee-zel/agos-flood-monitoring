// Test script to verify the complete SMS system
const fetch = require("node-fetch"); // You might need to install this

async function testSMSSystem() {
  const baseUrl = "http://localhost:3000";

  console.log("🧪 Testing Complete SMS Alert System...\n");

  try {
    // Test 1: Check current recipients
    console.log("1️⃣ Checking current SMS recipients...");
    const recipientsResponse = await fetch(`${baseUrl}/api/sms-recipients`);
    const recipientsData = await recipientsResponse.json();
    console.log("📱 Recipients:", JSON.stringify(recipientsData, null, 2));

    if (recipientsData.count === 0) {
      console.log("⚠️ No recipients found, adding a test number...");

      // Add a test recipient
      const addResponse = await fetch(`${baseUrl}/api/sms-recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+639171234567" }),
      });
      const addData = await addResponse.json();
      console.log("➕ Add result:", JSON.stringify(addData, null, 2));
    }

    // Test 2: Send a test SMS command
    console.log("\n2️⃣ Sending test SMS alert...");
    const smsResponse = await fetch(`${baseUrl}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertType: "critical",
        operator: "TestOperator",
        timestamp: new Date().toISOString(),
        sensorData: {
          waterLevel: 85.5,
          flowRate: 1.3,
          upstreamTurbidity: 45.2,
          downstreamTurbidity: 52.1,
          batteryLevel: 82,
          alertStatus: "EMERGENCY",
        },
      }),
    });
    const smsData = await smsResponse.json();
    console.log("📤 SMS Command Response:", JSON.stringify(smsData, null, 2));

    // Test 3: Check if Arduino can pick up the command
    console.log(
      "\n3️⃣ Checking SMS command queue (simulating Arduino request)..."
    );
    const commandResponse = await fetch(`${baseUrl}/api/sms-command`);
    const commandData = await commandResponse.json();
    console.log(
      "📥 Command for Arduino:",
      JSON.stringify(commandData, null, 2)
    );

    // Test 4: Check again (should be empty after pickup)
    console.log("\n4️⃣ Checking command queue again (should be empty)...");
    const commandResponse2 = await fetch(`${baseUrl}/api/sms-command`);
    const commandData2 = await commandResponse2.json();
    console.log(
      "📥 Command queue after pickup:",
      JSON.stringify(commandData2, null, 2)
    );

    console.log("\n✅ SMS System Test Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Check if Arduino Serial Monitor shows the command");
    console.log("2. Verify Arduino is connected to WiFi");
    console.log("3. Check if SIM800L GSM module is responding");
    console.log("4. Ensure SIM card has SMS credits");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testSMSSystem();

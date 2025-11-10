/**
 * Test Android SMS Gateway Connection
 * This script tests if the Android SMS Gateway API is working
 */

const https = require("https");

// Your Android SMS Gateway Cloud credentials
const username = "PZPOWL";
const password = "xd4cdwgmw6-z-k";
const url = "https://api.sms-gate.app/3rdparty/v1/message";

// Test message - MUST match Android SMS Gateway API specification
const payload = JSON.stringify({
  textMessage: {
    text: "Test from AGOS - This is a test message from your flood monitoring system.",
  },
  phoneNumbers: ["+639691467590"], // Your phone number
});

// Create Basic Auth header
const auth = Buffer.from(`${username}:${password}`).toString("base64");

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
    "Content-Length": payload.length,
  },
};

console.log("📱 Testing Android SMS Gateway (Cloud Mode)...");
console.log("🔗 URL:", url);
console.log("👤 Username:", username);
console.log("📞 Recipient: +639691467590");
console.log("");

const req = https.request(url, options, (res) => {
  console.log(`✅ Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log("📄 Response Headers:", res.headers);
  console.log("");

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("📥 Response Body:");
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log("");
        console.log("🎉 SUCCESS! SMS queued for sending.");
        console.log("📱 Check your Android SMS Gateway app for status.");
        console.log("📞 Check your phone for the test message.");
      } else {
        console.log("");
        console.log("❌ ERROR: SMS not sent.");
        console.log(
          "💡 Check your Android app is online and Cloud Server is enabled."
        );
      }
    } catch (e) {
      console.log(data);
      console.log("");
      console.log("❌ ERROR: Could not parse response.");
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Network Error:", error.message);
  console.log("");
  console.log("💡 Troubleshooting:");
  console.log("1. Check your internet connection");
  console.log("2. Verify username and password are correct");
  console.log("3. Ensure Android SMS Gateway app is online");
});

req.write(payload);
req.end();

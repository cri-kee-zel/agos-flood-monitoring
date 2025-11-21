// Test Arduino R4 WiFi endpoint
// Run this to verify server is receiving data correctly
// Usage: node test-arduino-endpoint.js

const http = require("http");

console.log("🧪 Testing Arduino R4 WiFi endpoint...\n");

// Test data mimicking Arduino R4 WiFi
const testData = {
  type: "sensor-data",
  waterLevel: 10.5,
  sensor1: true,
  sensor2: false,
  sensor3: false,
  timestamp: new Date().toISOString(),
  rssi: -45,
  uptime: 120,
};

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/arduino-serial",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(JSON.stringify(testData)),
  },
};

console.log("📤 Sending test data:");
console.log(JSON.stringify(testData, null, 2));
console.log("");

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);

  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("📥 Server Response:");
    console.log(responseData);
    console.log("");

    if (res.statusCode === 200) {
      console.log("✅ Test PASSED! Server is ready to receive Arduino data.");
      console.log("");
      console.log("Next steps:");
      console.log("1. Upload arduino_r4_wifi_agos.ino to your Arduino");
      console.log("2. Update WiFi credentials and server IP in the sketch");
      console.log("3. Open Module 4 Serial Monitor to see live data");
      console.log("4. Go to: http://localhost:3000/emergency");
    } else {
      console.log("❌ Test FAILED! Check server logs for errors.");
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Connection Error:", error.message);
  console.log("");
  console.log("Make sure the server is running:");
  console.log("  node server.js");
});

req.write(JSON.stringify(testData));
req.end();

// Test heartbeat after 2 seconds
setTimeout(() => {
  console.log("\n💓 Testing heartbeat endpoint...\n");

  const heartbeatData = {
    type: "heartbeat",
    timestamp: new Date().toISOString(),
    uptime: 150,
    rssi: -47,
  };

  const hbOptions = { ...options };
  hbOptions.headers["Content-Length"] = Buffer.byteLength(
    JSON.stringify(heartbeatData)
  );

  const hbReq = http.request(hbOptions, (res) => {
    console.log(`📡 Heartbeat Response: ${res.statusCode}`);

    res.on("data", (chunk) => {
      console.log("📥", chunk.toString());
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ Heartbeat test PASSED!");
      }
      process.exit(0);
    });
  });

  hbReq.on("error", (error) => {
    console.error("❌ Heartbeat Error:", error.message);
    process.exit(1);
  });

  hbReq.write(JSON.stringify(heartbeatData));
  hbReq.end();
}, 2000);

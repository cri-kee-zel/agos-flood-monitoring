// Arduino Command Monitor - Run this to see if Arduino is checking for commands
const fetch = require("node-fetch");

async function monitorArduinoCommands() {
  const baseUrl = "http://localhost:3000";

  console.log("🔍 Monitoring Arduino SMS command requests...");
  console.log("🕐 Checking every 5 seconds (same as Arduino)...");
  console.log("Press Ctrl+C to stop\n");

  let requestCount = 0;

  const monitor = setInterval(async () => {
    try {
      requestCount++;
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/api/sms-command`);
      const data = await response.json();

      const responseTime = Date.now() - startTime;

      console.log(
        `[${new Date().toLocaleTimeString()}] Request #${requestCount}:`
      );
      console.log(`  📡 Response Time: ${responseTime}ms`);
      console.log(
        `  📦 Command: ${data.command ? JSON.stringify(data) : "null"}`
      );

      if (data.command) {
        console.log(
          `  🎯 COMMAND DETECTED! Arduino should be processing this.`
        );
      }

      console.log(""); // Empty line for readability
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }, 5000); // Same interval as Arduino

  // Stop after 2 minutes
  setTimeout(() => {
    clearInterval(monitor);
    console.log("⏹️ Monitoring stopped.");
  }, 120000);
}

monitorArduinoCommands();

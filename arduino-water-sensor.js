const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const axios = require("axios");

// ========== CONFIGURATION ==========
const ARDUINO_PORT = "COM6"; // ✅ Updated to your Arduino port (USB Serial Device COM6)
const ARDUINO_BAUD = 115200;
const AGOS_SERVER = "http://localhost:3000"; // Your AGOS server URL

console.log("╔════════════════════════════════════════════════════╗");
console.log("║   🌊 AGOS Water Level Sensor Bridge 🌊            ║");
console.log("║   Triple Sensor System → AGOS Integration         ║");
console.log("╚════════════════════════════════════════════════════╝");
console.log("");
console.log(`📡 Arduino Port: ${ARDUINO_PORT}`);
console.log(`🌐 AGOS Server: ${AGOS_SERVER}`);
console.log(`⚡ Baud Rate: ${ARDUINO_BAUD}`);
console.log("");
console.log("🔄 Connecting to Arduino...");

// ========== SERIAL PORT SETUP ==========
const port = new SerialPort({
  path: ARDUINO_PORT,
  baudRate: ARDUINO_BAUD,
  autoOpen: true,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// Track statistics
let packetsReceived = 0;
let packetsSent = 0;
let lastWaterLevel = -1;
let startTime = Date.now();

// ========== EVENT HANDLERS ==========

port.on("open", () => {
  console.log("✅ Connected to Arduino successfully!");
  console.log("📊 Listening for water level data...");
  console.log("💡 Press Ctrl+C to stop");
  console.log("");
  console.log("─────────────────────────────────────────────────────");
  console.log("");
});

port.on("error", (err) => {
  console.error("");
  console.error("╔════════════════════════════════════════════════════╗");
  console.error("║  ❌ SERIAL PORT ERROR                              ║");
  console.error("╚════════════════════════════════════════════════════╝");
  console.error("Error:", err.message);
  console.error("");
  console.error("💡 Troubleshooting:");
  console.error("   1. Check if Arduino is plugged in via USB");
  console.error("   2. Verify the COM port is correct:");
  console.error("      - Windows: Check Device Manager → Ports");
  console.error(
    "      - PowerShell: Get-WmiObject -Query \"SELECT * FROM Win32_PnPEntity WHERE Name LIKE '%Arduino%'\" | Select-Object Name"
  );
  console.error("   3. Close Arduino Serial Monitor (cannot share port)");
  console.error("   4. Update ARDUINO_PORT at top of this file");
  console.error("   5. Try different USB cable or port");
  console.error("");
  process.exit(1);
});

// ========== DATA PARSING ==========

parser.on("data", async (line) => {
  const trimmed = line.trim();

  // Look for JSON water level data
  if (trimmed.startsWith("{") && trimmed.includes("waterLevel")) {
    try {
      const data = JSON.parse(trimmed);
      packetsReceived++;

      // Display received data
      const timestamp = new Date().toLocaleTimeString();
      console.log(
        `[${timestamp}] 📥 Arduino Data Received (#${packetsReceived})`
      );
      console.log("├─ Water Level:", data.waterLevel, "inches");

      // Show which sensors are active
      const sensor1Status = data.sensor1 ? "💧 WATER" : "💨 DRY";
      const sensor2Status = data.sensor2 ? "💧 WATER" : "💨 DRY";
      const sensor3Status = data.sensor3 ? "💧 WATER" : "💨 DRY";

      console.log(`├─ Sensor 1 (10" Half-knee): ${sensor1Status}`);
      console.log(`├─ Sensor 2 (19" Knee):      ${sensor2Status}`);
      console.log(`├─ Sensor 3 (37" Waist):     ${sensor3Status}`);

      // Show flow rate and theory components if present
      if (data.flowRate !== undefined) {
        // Check if theory components are present (new code)
        if (
          data.attenuation !== undefined &&
          data.variance !== undefined &&
          data.fluctuation !== undefined
        ) {
          console.log(`├─ 🔬 THEORY COMPONENTS:`);
          console.log(
            `│  ├─ Attenuation: ${data.attenuation.toFixed(4)} (sediment)`
          );
          console.log(
            `│  ├─ Variance: ${data.variance.toFixed(2)} (particle velocity)`
          );
          console.log(
            `│  └─ Fluctuation: ${data.fluctuation.toFixed(4)} (turbulence)`
          );
          console.log(
            `├─ Flow Velocity: ${data.flowRate.toFixed(4)} m/s (${(
              data.flowRate * 100
            ).toFixed(2)} cm/s)`
          );
          console.log(
            `└─ Active Sensor: ${
              data.activeSensor >= 0
                ? "Sensor " + (data.activeSensor + 1)
                : "None"
            }`
          );
        } else {
          // Old format (raw reading)
          console.log(`├─ Flow Rate: ${data.flowRate} (raw POF reading)`);
          console.log(
            `└─ Active Sensor: ${
              data.activeSensor >= 0
                ? "Sensor " + (data.activeSensor + 1)
                : "None"
            }`
          );
        }
      } else {
        console.log(`└─ ⚠️ Flow Rate: Not included in data`);
      }

      // Alert on level changes
      if (lastWaterLevel !== data.waterLevel) {
        if (data.waterLevel > lastWaterLevel) {
          console.log(
            "   ⚠️  WATER RISING! ",
            lastWaterLevel,
            "→",
            data.waterLevel,
            "inches"
          );
        } else if (data.waterLevel < lastWaterLevel) {
          console.log(
            "   ✅ Water receding:",
            lastWaterLevel,
            "→",
            data.waterLevel,
            "inches"
          );
        }
        lastWaterLevel = data.waterLevel;
      }

      // Send to AGOS server
      await sendToAGOS(data, timestamp);

      console.log("");
    } catch (error) {
      console.error("❌ JSON Parse Error:", error.message);
      console.error("   Raw data:", trimmed.substring(0, 100));
    }
  }
  // Optionally display non-JSON lines (Arduino debug messages)
  else if (trimmed.length > 0 && !trimmed.startsWith("=")) {
    // Comment this out if too much output
    // console.log('💬 Arduino:', trimmed);
  }
});

// ========== AGOS SERVER INTEGRATION ==========

async function sendToAGOS(arduinoData, timestamp) {
  try {
    // Convert Arduino format to AGOS format
    const agosData = {
      // Primary water level from triple sensor system
      waterLevel: arduinoData.waterLevel, // 0, 10, 19, or 37 inches

      // These fields expected by AGOS (set to 0 if not measured)
      flowRate: 0, // Not measured by this sensor system
      upstreamTurbidity: 0,
      downstreamTurbidity: 0,

      // Use water level as distance measurement for AGOS compatibility
      distance1: arduinoData.waterLevel,
      distance2: arduinoData.sensor2 ? 19 : 0, // If sensor 2 active, report 19
      distance3: arduinoData.sensor3 ? 37 : 0, // If sensor 3 active, report 37

      // System status
      batteryLevel: 85, // Default (add battery sensor to Arduino if needed)
      timestamp: new Date().toISOString(),

      // Metadata for AGOS
      sensorSystem: "Triple POF Water Level",
      arduinoTimestamp: arduinoData.timestamp,
      sensor1Active: arduinoData.sensor1,
      sensor2Active: arduinoData.sensor2,
      sensor3Active: arduinoData.sensor3,
    };

    // POST to AGOS server
    const response = await axios.post(
      `${AGOS_SERVER}/api/arduino-data`,
      agosData,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AGOS-Water-Sensor-Bridge/1.0",
        },
        timeout: 5000, // 5 second timeout
      }
    );

    packetsSent++;

    // Success!
    console.log("   ✅ Sent to AGOS server successfully");
    console.log("   ├─ Status:", response.status, response.statusText);

    if (response.data.alertStatus) {
      const alertEmoji = {
        NORMAL: "🟢",
        MODERATE: "🟡",
        HIGH: "🟠",
        CRITICAL: "🔴",
      };
      const emoji = alertEmoji[response.data.alertStatus] || "⚪";
      console.log(`   ├─ Alert Level: ${emoji} ${response.data.alertStatus}`);
    }

    console.log(`   └─ Packets sent: ${packetsSent}/${packetsReceived}`);
  } catch (error) {
    console.error("   ❌ Failed to send to AGOS server!");

    if (error.code === "ECONNREFUSED") {
      console.error("   ├─ Connection refused - is AGOS server running?");
      console.error(`   └─ Check: ${AGOS_SERVER}`);
    } else if (error.code === "ETIMEDOUT") {
      console.error("   └─ Request timed out - server not responding");
    } else if (error.response) {
      console.error(
        "   ├─ Server responded with error:",
        error.response.status
      );
      console.error("   └─ Message:", error.response.data);
    } else {
      console.error("   └─ Error:", error.message);
    }

    console.error("");
    console.error("   💡 Make sure:");
    console.error("      1. AGOS server is running (npm start)");
    console.error("      2. Server URL is correct:", AGOS_SERVER);
    console.error("      3. Firewall is not blocking port 3000");
    console.error("");
  }
}

// ========== GRACEFUL SHUTDOWN ==========

process.on("SIGINT", () => {
  console.log("");
  console.log("");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║  👋 Shutting down...                              ║");
  console.log("╚════════════════════════════════════════════════════╝");

  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(uptime / 60);
  const seconds = uptime % 60;

  console.log("");
  console.log("📊 Session Statistics:");
  console.log(`   ├─ Uptime: ${minutes}m ${seconds}s`);
  console.log(`   ├─ Packets received: ${packetsReceived}`);
  console.log(`   ├─ Packets sent: ${packetsSent}`);
  console.log(
    `   └─ Success rate: ${
      packetsReceived > 0
        ? Math.round((packetsSent / packetsReceived) * 100)
        : 0
    }%`
  );
  console.log("");

  port.close();
  console.log("✅ Serial port closed");
  console.log("✅ Bridge stopped successfully");
  console.log("");
  process.exit(0);
});

// ========== PERIODIC STATUS ==========

// Display status every 60 seconds
setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(uptime / 60);

  console.log("─────────────────────────────────────────────────────");
  console.log(`📈 Status Update: ${minutes} minutes uptime`);
  console.log(`   Packets: ${packetsReceived} received, ${packetsSent} sent`);
  console.log(`   Last water level: ${lastWaterLevel} inches`);
  console.log("─────────────────────────────────────────────────────");
  console.log("");
}, 60000); // Every 60 seconds

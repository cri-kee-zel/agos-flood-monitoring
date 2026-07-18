const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const DEFAULT_SMS_GATEWAY_CONFIG = {
  // Use the full API path to avoid gateway redirects (301)
  url: "https://api.sms-gate.app/3rdparty/v1/message",
  user: "PGTRN",
  pass: "glootxy0ncshl1",
  deviceId: "a3VFk4Ff-DaBFvIKJ1BnA",
};

function getSmsGatewayConfig() {
  const rawUrl = (process.env.SMS_GATEWAY_URL || "").trim();
  const rawUser = (process.env.SMS_GATEWAY_USER || "").trim();
  const rawPass = (process.env.SMS_GATEWAY_PASS || "").trim();
  const rawDeviceId = (process.env.SMS_GATEWAY_DEVICE_ID || "").trim();
  // Normalize URL: ensure API path is present when only host/port provided
  let finalUrl = DEFAULT_SMS_GATEWAY_CONFIG.url;
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      // If pathname is empty or root, append the API path
      if (!u.pathname || u.pathname === "/") {
        u.pathname = "/3rdparty/v1/message";
      }
      finalUrl = u.toString();
    } catch (e) {
      // If parsing fails, fallback to default
      finalUrl = DEFAULT_SMS_GATEWAY_CONFIG.url;
    }
  }

  return {
    url: finalUrl,
    user:
      rawUser && rawUser !== "PGTRN"
        ? rawUser
        : DEFAULT_SMS_GATEWAY_CONFIG.user,
    pass:
      rawPass && rawPass !== "glootxy0ncshl1"
        ? rawPass
        : DEFAULT_SMS_GATEWAY_CONFIG.pass,
    deviceId:
      rawDeviceId && rawDeviceId !== "a3VFk4Ff-DaBFvIKJ1BnA"
        ? rawDeviceId
        : DEFAULT_SMS_GATEWAY_CONFIG.deviceId,
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  }),
);

// Logging
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve static files from specific paths to avoid conflicts
app.use("/main", express.static(path.join(__dirname, "main")));
app.use("/module_1", express.static(path.join(__dirname, "module_1")));
app.use("/module_2", express.static(path.join(__dirname, "module_2")));
app.use("/module_3", express.static(path.join(__dirname, "module_3")));
app.use("/module_4", express.static(path.join(__dirname, "module_4")));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: require("./package.json").version,
    environment: process.env.NODE_ENV || "development",
  });
});

// Temporary debug endpoint to verify which SMS gateway credentials the
// running instance is using. Returns masked username and gateway URL.
app.get("/api/debug-gateway", (req, res) => {
  const user = process.env.SMS_GATEWAY_USER || null;
  const gatewayUrl = process.env.SMS_GATEWAY_URL || null;
  const mask = (s) => {
    if (!s) return null;
    return s.replace(/.(?=.{2})/g, "*");
  };

  res.json({
    smsGatewayUserMasked: mask(user),
    smsGatewayUrl: gatewayUrl,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});

// Serve AGOS modules
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "main.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "module_1", "index.html"));
});

app.get("/mapping", (req, res) => {
  res.sendFile(path.join(__dirname, "module_2", "module2.html"));
});

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "module_3", "module3.html"));
});

app.get("/emergency", (req, res) => {
  const filePath = path.join(__dirname, "module_4", "module4.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`❌ Failed to serve /emergency -> ${filePath}:`, err);
      if (!res.headersSent) res.status(err.status || 500).end();
    } else {
      console.log(`📄 Served /emergency -> ${filePath}`);
    }
  });
});

app.get("/water-control", (req, res) => {
  res.sendFile(path.join(__dirname, "water-level-control.html"));
});

// Global variable to store latest Arduino data
let latestArduinoData = {
  waterLevel: 0,
  distance2: 0,
  timestamp: new Date().toISOString(),
  connected: false,
};

// Manual control flag - when true, don't override with simulated data
let manualWaterLevelControl = false;
let manualWaterLevel = 0;

// Command queue for Arduino (two-way communication)
let pendingArduinoCommand = null;

// API endpoint to receive Arduino data
app.post("/api/arduino-data", (req, res) => {
  const { distance1, distance2, timestamp } = req.body;

  // Store Arduino data (distance1 becomes waterLevel for frontend)
  latestArduinoData = {
    waterLevel: parseFloat(distance1) || 0,
    distance2: parseFloat(distance2) || 0,
    timestamp: new Date().toISOString(),
    connected: true,
  };

  console.log(
    `📡 Arduino data received: distance1=${distance1}cm, distance2=${distance2}cm`,
  );

  // Broadcast to all WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "sensor-data",
          data: {
            timestamp: latestArduinoData.timestamp,
            waterLevel: latestArduinoData.waterLevel,
            flowRate: Math.random() * 5 + 1, // Still simulated
            batteryLevel: 90,
            signalStrength: -45,
          },
        }),
      );
    }
  });

  res.json({ status: "success" });
});

// ========================================
// Arduino R4 WiFi Serial Data Endpoint
// ========================================
// Receives data from Arduino R4 WiFi and broadcasts to Module 4 serial monitor
app.post("/api/arduino-serial", express.json(), (req, res) => {
  try {
    const {
      type,
      waterLevel,
      sensor1,
      sensor2,
      sensor3,
      timestamp,
      rssi,
      uptime,
    } = req.body;

    // Format timestamp for display
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const msStr = String(now.getMilliseconds()).padStart(3, "0");
    const displayTime = `[${timeStr}.${msStr}]`;

    let logMessage = "";
    let logType = "info";

    if (type === "sensor-data") {
      // Store Arduino data for Module 1 dashboard
      latestArduinoData = {
        waterLevel: parseFloat(waterLevel) || 0,
        distance2: 0,
        timestamp: new Date().toISOString(),
        connected: true,
      };

      // Format sensor status
      const s1 = sensor1 ? "●" : "○";
      const s2 = sensor2 ? "●" : "○";
      const s3 = sensor3 ? "●" : "○";

      logMessage = `📊 Water Level: ${waterLevel}" | Sensors: S1=${s1} S2=${s2} S3=${s3} | Signal: ${rssi}dBm`;
      logType =
        waterLevel >= 19 ? "error" : waterLevel >= 10 ? "warning" : "success";

      console.log(`${displayTime} ${logMessage}`);

      // Broadcast sensor data to all clients (Module 1)
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "sensor-data",
              data: {
                timestamp: new Date().toISOString(),
                waterLevel: parseFloat(waterLevel) || 0,
                flowRate: Math.random() * 5 + 1,
                batteryLevel: 90,
                signalStrength: rssi || -45,
              },
            }),
          );
        }
      });
    } else if (type === "heartbeat") {
      logMessage = `💓 Heartbeat | Uptime: ${uptime}s | Signal: ${rssi}dBm`;
      logType = "info";
      console.log(`${displayTime} ${logMessage}`);
    } else {
      logMessage = `📥 ${JSON.stringify(req.body)}`;
      logType = "info";
      console.log(`${displayTime} ${logMessage}`);
    }

    // Broadcast to Module 4 serial monitor
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "arduino-serial",
            timestamp: displayTime,
            message: logMessage,
            logType: logType,
            rawData: req.body,
          }),
        );
      }
    });

    res.json({ success: true, message: "Data received" });
  } catch (error) {
    console.error("❌ Error processing Arduino data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Arduino Command Poll Endpoint (Two-Way Communication)
// ========================================
// Arduino polls this endpoint to check for pending commands from web interface
app.get("/api/arduino-command", (req, res) => {
  if (pendingArduinoCommand) {
    const command = pendingArduinoCommand;
    pendingArduinoCommand = null; // Clear after sending
    console.log(`📤 Sending command to Arduino: ${command}`);
    res.json({ command: command });
  } else {
    res.json({ command: null });
  }
});

// API endpoint for sensor data
app.get("/api/sensor-data", (req, res) => {
  // Use real Arduino data if available, otherwise simulate
  const dataAge = Date.now() - new Date(latestArduinoData.timestamp).getTime();
  const useRealData = latestArduinoData.connected && dataAge < 30000; // Use if less than 30s old

  const sensorData = {
    timestamp: new Date().toISOString(),
    waterLevel: useRealData
      ? latestArduinoData.waterLevel
      : Math.random() * 100 + 50,
    flowRate: Math.random() * 5 + 1,
    rainfall: Math.random() * 20,
    temperature: Math.random() * 10 + 25,
    humidity: Math.random() * 30 + 60,
    batteryLevel: Math.random() * 20 + 80,
    signalStrength: Math.floor(Math.random() * 31),
    arduinoConnected: useRealData,
  };

  res.json(sensorData);
});

// API endpoint for system overview (for main gateway)
app.get("/api/system-overview", (req, res) => {
  const overview = {
    timestamp: new Date().toISOString(),
    systemStatus: "online",
    sensors: {
      online: 3,
      total: 3,
    },
    currentData: {
      waterLevel: Math.random() * 50 + 30,
      flowRate: Math.random() * 3 + 1,
      alertStatus: Math.random() > 0.8 ? "ALERT" : "NORMAL",
      batteryLevel: Math.random() * 20 + 80,
    },
    systemStats: {
      aiAccuracy: Math.random() * 5 + 85,
      uptime: Math.random() * 0.5 + 99.5,
    },
  };

  res.json(overview);
});

// API endpoint for historical data
app.get("/api/historical-data", (req, res) => {
  const { range = "24h" } = req.query;

  // Generate historical data based on range
  const data = generateHistoricalData(range);
  res.json(data);
});

// API endpoint for flood events
app.get("/api/flood-events", (req, res) => {
  const events = generateFloodEvents();
  res.json(events);
});

// ========================================
// Android SMS Gateway Webhook Receiver
// ========================================
// Receives incoming SMS notifications from Android SMS Gateway
app.post("/api/sms-webhook", express.json(), (req, res) => {
  console.log("📩 Incoming SMS webhook received");
  console.log("📄 Webhook payload:", JSON.stringify(req.body, null, 2));

  try {
    const { event, payload } = req.body;

    if (event === "sms:received") {
      const { messageId, message, phoneNumber, simNumber, receivedAt } =
        payload;

      console.log(`📱 SMS Received:`);
      console.log(`  From: ${phoneNumber}`);
      console.log(`  Message: ${message}`);
      console.log(`  SIM: ${simNumber}`);
      console.log(`  Time: ${receivedAt}`);

      // Broadcast to all connected WebSocket clients (Module 4)
      const notification = {
        type: "sms-received",
        messageId,
        phoneNumber,
        message,
        simNumber,
        receivedAt,
        timestamp: new Date().toISOString(),
      };

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
        }
      });

      console.log(
        `✅ Incoming SMS broadcasted to ${wss.clients.size} WebSocket clients`,
      );

      // Optional: Store in database or log file
      // You can add database storage here if needed

      res.json({
        success: true,
        message: "SMS webhook received and processed",
      });
    } else {
      console.log(`⚠️ Unknown event type: ${event}`);
      res.json({
        success: true,
        message: "Event received but not processed",
      });
    }
  } catch (error) {
    console.error("❌ Error processing SMS webhook:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// SMS Logging Endpoint (receives logs from Module 4)
app.post("/api/sms-sent-log", express.json(), (req, res) => {
  console.log("📤 SMS Sent Log received");
  console.log("📄 Log data:", JSON.stringify(req.body, null, 2));

  try {
    const {
      alertType,
      message,
      recipients,
      timestamp,
      operator,
      gatewayMode,
      gatewayResponse,
    } = req.body;

    console.log(`✅ SMS Alert Logged:`);
    console.log(`  Type: ${alertType}`);
    console.log(`  Operator: ${operator}`);
    console.log(`  Recipients: ${recipients ? recipients.length : 0}`);
    console.log(`  Gateway: Android SMS Gateway (${gatewayMode} mode)`);
    console.log(`  Time: ${timestamp}`);

    // Optional: Store in database
    // db.run("INSERT INTO sms_logs ...");

    res.json({
      success: true,
      message: "SMS log recorded",
    });
  } catch (error) {
    console.error("❌ Error logging SMS:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Recipients Management API
const recipientsFile = path.join(__dirname, "recipients.json");

// Get all recipients
app.get("/api/recipients", (req, res) => {
  try {
    if (fs.existsSync(recipientsFile)) {
      const data = fs.readFileSync(recipientsFile, "utf8");
      const recipientsData = JSON.parse(data);
      res.json({
        success: true,
        recipients: recipientsData.recipients || [],
        count: (recipientsData.recipients || []).length,
      });
    } else {
      res.json({ success: true, recipients: [], count: 0 });
    }
  } catch (error) {
    console.error("❌ Error reading recipients:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to read recipients" });
  }
});

// Add recipient
app.post("/api/recipients", express.json(), (req, res) => {
  try {
    const { phoneNumber, name, role } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Read current recipients
    let recipients = { recipients: [] };
    if (fs.existsSync(recipientsFile)) {
      const data = fs.readFileSync(recipientsFile, "utf8");
      recipients = JSON.parse(data);
    }

    // Add new recipient
    const newRecipient = {
      phoneNumber,
      name: name || "Unknown",
      role: role || "Resident",
      addedAt: new Date().toISOString(),
    };

    recipients.recipients.push(newRecipient);

    // Save to file
    fs.writeFileSync(recipientsFile, JSON.stringify(recipients, null, 2));

    console.log(`✅ Recipient added: ${phoneNumber}`);
    res.json({
      success: true,
      recipient: newRecipient,
      recipients: recipients.recipients,
      count: recipients.recipients.length,
    });
  } catch (error) {
    console.error("❌ Error adding recipient:", error);
    res.status(500).json({ success: false, error: "Failed to add recipient" });
  }
});

// Delete recipient
app.delete("/api/recipients/:phoneNumber", (req, res) => {
  try {
    const phoneNumber = decodeURIComponent(req.params.phoneNumber);

    if (!fs.existsSync(recipientsFile)) {
      return res
        .status(404)
        .json({ success: false, error: "No recipients found" });
    }

    const data = fs.readFileSync(recipientsFile, "utf8");
    const recipients = JSON.parse(data);

    // Filter out the recipient
    const originalLength = recipients.recipients.length;
    recipients.recipients = recipients.recipients.filter(
      (r) => r.phoneNumber !== phoneNumber && r !== phoneNumber,
    );

    if (recipients.recipients.length === originalLength) {
      return res
        .status(404)
        .json({ success: false, error: "Recipient not found" });
    }

    // Save to file
    fs.writeFileSync(recipientsFile, JSON.stringify(recipients, null, 2));

    console.log(`✅ Recipient deleted: ${phoneNumber}`);
    res.json({
      success: true,
      phoneNumber,
      recipients: recipients.recipients,
      count: recipients.recipients.length,
    });
  } catch (error) {
    console.error("❌ Error deleting recipient:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete recipient" });
  }
});

// SMS Gateway Proxy Endpoint (to avoid CORS issues)
app.post("/api/sms-gateway-proxy", express.json(), async (req, res) => {
  try {
    const { payload } = req.body;
    const smsGateway = getSmsGatewayConfig();

    const gatewayUrl = smsGateway.url;
    const username = smsGateway.user;
    const password = smsGateway.pass;
    const deviceId = smsGateway.deviceId;

    console.log("📱 SMS Gateway Proxy Request:");
    console.log("  URL:", gatewayUrl);
    console.log(
      "  Username:",
      username ? username.replace(/.(?=.{2})/g, "*") : "(none)",
    );
    console.log(
      "  Device ID:",
      deviceId ? deviceId.replace(/.(?=.{2})/g, "*") : "(none)",
    );
    console.log("  Recipients:", payload ? payload.phoneNumbers.length : 0);
    console.log("  Payload:", JSON.stringify(payload, null, 2));

    // Create Basic Auth header using the resolved gateway credentials
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    // Determine which module to use (http or https)
    const isHttps = gatewayUrl && gatewayUrl.startsWith("https");
    const httpModule = isHttps ? require("https") : require("http");
    const parsedUrl = new URL(gatewayUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      // include pathname and query string so requests go directly to the API
      path: (parsedUrl.pathname || "") + (parsedUrl.search || ""),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        "Content-Length": Buffer.byteLength(JSON.stringify(payload || {})),
      },
    };

    // Make request to Android SMS Gateway
    const proxyReq = httpModule.request(options, (proxyRes) => {
      let data = "";

      proxyRes.on("data", (chunk) => {
        data += chunk;
      });

      proxyRes.on("end", () => {
        console.log(`✅ SMS Gateway Response: ${proxyRes.statusCode}`);
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
          console.log(
            "🔁 SMS Gateway redirected to:",
            proxyRes.headers.location || "(no location header)",
          );
        }
        console.log("📄 Response:", data);

        try {
          const response = JSON.parse(data);
          res.status(proxyRes.statusCode).json(response);
        } catch (e) {
          res.status(proxyRes.statusCode).send(data);
        }
      });
    });

    proxyReq.on("error", (error) => {
      console.error("❌ SMS Gateway Proxy Error:", error);
      res.status(500).json({
        error: "Failed to connect to SMS Gateway",
        message: error.message,
      });
    });

    proxyReq.write(JSON.stringify(payload || {}));
    proxyReq.end();
  } catch (error) {
    console.error("❌ Error in SMS Gateway Proxy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Note: PhilSMS proxy endpoint removed - using Android SMS Gateway instead

// WebSocket Server for real-time data
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

// Timed simulation sequence - new timing: 120s → 330s → 580s → reset after 3min
const simulationSequence = [
  { time: 0, level: 0 }, // Start: 0 inches - Both buttons disabled
  { time: 120, level: 2 }, // 2min: 2 inches (ankle) - Both buttons disabled
  { time: 330, level: 10 }, // 5min 30s: 10 inches (half knee) - Flood Watch enabled + auto-sends
  { time: 580, level: 19 }, // 9min 40s: 19 inches (knee) - Both buttons enabled + Flash Flood auto-sends
  { time: 760, level: 0 }, // 12min 40s (9:40 + 3min): reset to 0
];

const SIMULATION_CYCLE_DURATION = 760; // Loop every 12 minutes 40 seconds
let simulationStartTime = Date.now();

function getSimulatedWaterLevel() {
  const totalElapsed = (Date.now() - simulationStartTime) / 1000;
  const elapsedSeconds = totalElapsed % SIMULATION_CYCLE_DURATION; // Loop every 7 minutes

  // Find the exact level based on time - NO interpolation, instant jumps only
  let currentLevel = 0;
  for (let i = simulationSequence.length - 1; i >= 0; i--) {
    if (elapsedSeconds >= simulationSequence[i].time) {
      currentLevel = simulationSequence[i].level;
      break;
    }
  }

  return currentLevel;
}

wss.on("connection", (ws, req) => {
  console.log(
    "📡 New WebSocket connection from:",
    req.connection.remoteAddress,
  );

  // Reset simulation timer for each new connection
  simulationStartTime = Date.now();

  // Send initial sensor data
  ws.send(
    JSON.stringify({
      type: "sensor-data",
      data: {
        timestamp: new Date().toISOString(),
        waterLevel: latestArduinoData.waterLevel || 0, // Use Arduino data or default to 0
        flowRate: Math.random() * 5 + 1,
        batteryLevel: 90,
      },
    }),
  );

  // Set up periodic data sending
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      let waterLevel;

      // Check if manual control is active
      if (manualWaterLevelControl) {
        waterLevel = manualWaterLevel;
      } else {
        // Use real Arduino data if available, otherwise use timed simulation
        const dataAge =
          Date.now() - new Date(latestArduinoData.timestamp).getTime();
        const useRealData = latestArduinoData.connected && dataAge < 30000; // Use if less than 30s old

        waterLevel = useRealData
          ? latestArduinoData.waterLevel
          : getSimulatedWaterLevel(); // Use timed sequence simulation
      }

      console.log(`📤 Sending water level: ${waterLevel.toFixed(2)} inches`);

      ws.send(
        JSON.stringify({
          type: "sensor-data",
          data: {
            timestamp: new Date().toISOString(),
            waterLevel: waterLevel,
            flowRate: Math.random() * 5 + 1,
            rainfall: Math.random() * 20,
            temperature: Math.random() * 10 + 25,
            humidity: Math.random() * 30 + 60,
            batteryLevel: Math.random() * 20 + 80,
            signalStrength: Math.floor(Math.random() * 31),
          },
        }),
      );
    }
  }, 5000); // Send data every 5 seconds

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📥 Received message:", data);

      // Handle different message types
      switch (data.type) {
        case "alert":
          handleEmergencyAlert(data);
          break;
        case "command":
          handleArduinoCommand(data);
          break;
        case "water-level-control":
          // Water level control from water-control page
          console.log(`💧 Water level control: ${data.level} inches`);

          // Enable manual control mode
          manualWaterLevelControl = true;
          manualWaterLevel = data.level;

          // Update global water level data
          latestArduinoData.waterLevel = data.level;
          latestArduinoData.timestamp = new Date().toISOString();

          // Broadcast to all clients (Module 1 dashboard)
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "sensor-data",
                  data: {
                    timestamp: new Date().toISOString(),
                    waterLevel: data.level,
                    flowRate: Math.random() * 5 + 1,
                    batteryLevel: 90,
                    signalStrength: -45,
                  },
                }),
              );
            }
          });
          break;
        case "arduino-command":
          // Command from web serial monitor to Arduino
          console.log("🎮 Arduino command from web:", data.command);

          // Store command for Arduino to poll
          pendingArduinoCommand = data.command;

          // Echo back to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              const now = new Date();
              const timeStr = now.toTimeString().split(" ")[0];
              const msStr = String(now.getMilliseconds()).padStart(3, "0");
              const displayTime = `[${timeStr}.${msStr}]`;

              client.send(
                JSON.stringify({
                  type: "arduino-serial",
                  timestamp: displayTime,
                  message: `📤 Command queued for Arduino: ${data.command}`,
                  logType: "info",
                }),
              );
            }
          });
          break;
        default:
          console.log("🤷 Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("💥 Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket connection closed");
    clearInterval(interval);
  });

  ws.on("error", (error) => {
    console.error("💥 WebSocket error:", error);
    clearInterval(interval);
  });
});

// Helper function to generate historical data
function generateHistoricalData(range) {
  const data = [];
  const now = new Date();
  let hours = 24;

  switch (range) {
    case "6h":
      hours = 6;
      break;
    case "12h":
      hours = 12;
      break;
    case "24h":
      hours = 24;
      break;
    case "7d":
      hours = 24 * 7;
      break;
    case "30d":
      hours = 24 * 30;
      break;
    default:
      hours = 24;
  }

  const points = Math.min(hours * 12, 1000); // Max 1000 points

  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals

    data.push({
      timestamp: timestamp.toISOString(),
      waterLevel: Math.random() * 50 + 30 + Math.sin(i / 10) * 20,
      flowRate: Math.random() * 3 + 1 + Math.cos(i / 15) * 1,
      rainfall: Math.random() * 15,
      temperature: Math.random() * 8 + 26,
      humidity: Math.random() * 20 + 70,
      batteryLevel: Math.max(20, 100 - (i / points) * 30),
    });
  }

  return data;
}

// Helper function to generate flood events
function generateFloodEvents() {
  const events = [];
  const now = new Date();

  // Generate some sample flood events
  for (let i = 0; i < 5; i++) {
    const eventTime = new Date(
      now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    );

    events.push({
      id: i + 1,
      timestamp: eventTime.toISOString(),
      type: ["flash-flood", "flood-watch", "weather-update"][
        Math.floor(Math.random() * 3)
      ],
      severity: ["low", "medium", "high", "critical"][
        Math.floor(Math.random() * 4)
      ],
      waterLevel: Math.random() * 40 + 60,
      duration: Math.floor(Math.random() * 6) + 1,
      affectedAreas: ["Riverbank Communities", "Low-lying Areas"],
      description: "Automated flood event detected by AGOS system",
    });
  }

  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Handle emergency alerts
function handleEmergencyAlert(data) {
  console.log("🚨 Emergency alert received:", data);

  // Broadcast alert to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "emergency-alert",
          data: data,
        }),
      );
    }
  });
}

// Handle Arduino commands
function handleArduinoCommand(data) {
  console.log("🤖 Arduino command received:", data);
  // Here you would send commands to Arduino via serial/USB
  // For now, just acknowledge
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("👋 Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("👋 Server closed");
    process.exit(0);
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 AGOS Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Access URLs:`);
  console.log(`   - Main Gateway: http://localhost:${PORT}/`);
  console.log(`   - Real-time Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   - AI Mapping: http://localhost:${PORT}/mapping`);
  console.log(`   - Analytics: http://localhost:${PORT}/analytics`);
  console.log(`   - Emergency: http://localhost:${PORT}/emergency`);
});

module.exports = app;

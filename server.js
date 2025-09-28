const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
        upgradeInsecureRequests: null, // Explicitly disable this for HTTP deployment
      },
    },
  })
);

// CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  })
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
  res.sendFile(path.join(__dirname, "module_4", "module4.html"));
});

// Global variable to store latest Arduino data
let latestArduinoData = {
  waterLevel: 0,
  distance2: 0,
  timestamp: new Date().toISOString(),
  connected: false,
};

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
    `📡 Arduino data received: distance1=${distance1}cm, distance2=${distance2}cm`
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
        })
      );
    }
  });

  res.json({ status: "success" });
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

// WebSocket Server for real-time data
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  console.log(
    "📡 New WebSocket connection from:",
    req.connection.remoteAddress
  );

  // Send initial sensor data
  ws.send(
    JSON.stringify({
      type: "sensor-data",
      data: {
        timestamp: new Date().toISOString(),
        waterLevel: Math.random() * 100 + 50,
        flowRate: Math.random() * 5 + 1,
        batteryLevel: Math.random() * 20 + 80,
      },
    })
  );

  // Set up periodic data sending
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "sensor-data",
          data: {
            timestamp: new Date().toISOString(),
            waterLevel: Math.random() * 100 + 50,
            flowRate: Math.random() * 5 + 1,
            rainfall: Math.random() * 20,
            temperature: Math.random() * 10 + 25,
            humidity: Math.random() * 30 + 60,
            batteryLevel: Math.random() * 20 + 80,
            signalStrength: Math.floor(Math.random() * 31),
          },
        })
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
      now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
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
        })
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

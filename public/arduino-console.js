/**
 * AGOS Arduino Remote Console
 * Professional web-based Arduino Serial Monitor with remote calibration
 * Author: AGOS Development Team
 * Date: 2025-10-19
 */

class ArduinoConsole {
  constructor() {
    this.config = {
      UPDATE_INTERVAL: 1000, // 1 second
      MAX_LOG_LINES: 1000,
      RECONNECT_DELAY: 3000,
      PING_INTERVAL: 5000,
    };

    this.state = {
      socket: null,
      isConnected: false,
      autoScroll: true,
      currentFilter: "all",
      logBuffer: [],
      lastPing: null,
      pingTime: null,
    };

    this.elements = {};
    this.init();
  }

  init() {
    console.log("🎮 Initializing Arduino Remote Console...");

    this.cacheElements();
    this.setupEventHandlers();
    this.connectWebSocket();
    this.startPingMonitoring();

    console.log("✅ Arduino Console ready!");
  }

  cacheElements() {
    this.elements = {
      // Status elements
      arduinoStatus: document.getElementById("arduino-status"),
      arduinoStatusText: document.getElementById("arduino-status-text"),
      websocketStatus: document.getElementById("websocket-status"),
      pingValue: document.getElementById("ping-value"),

      // Console elements
      consoleOutput: document.getElementById("console-output"),
      commandInput: document.getElementById("command-input"),

      // Live readings
      liveWaterLevel: document.getElementById("live-water-level"),
      liveFlowRate: document.getElementById("live-flow-rate"),
      liveUpstream: document.getElementById("live-upstream"),
      liveDownstream: document.getElementById("live-downstream"),
      liveBattery: document.getElementById("live-battery"),
      liveWifiSignal: document.getElementById("live-wifi-signal"),

      // Calibration form
      sensorType: document.getElementById("sensor-type"),
      referenceValue: document.getElementById("reference-value"),
      calibrationFactor: document.getElementById("calibration-factor"),

      // Indicators
      autoscrollIndicator: document.getElementById("autoscroll-indicator"),
    };
  }

  setupEventHandlers() {
    // Toolbar buttons
    document.getElementById("connect-btn").addEventListener("click", () => {
      this.connectWebSocket();
    });

    document.getElementById("disconnect-btn").addEventListener("click", () => {
      this.disconnectWebSocket();
    });

    document.getElementById("clear-btn").addEventListener("click", () => {
      this.clearConsole();
    });

    document.getElementById("download-btn").addEventListener("click", () => {
      this.downloadLog();
    });

    document
      .getElementById("reset-arduino-btn")
      .addEventListener("click", () => {
        this.resetArduino();
      });

    // Command input
    this.elements.commandInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendCommand();
      }
    });

    document
      .getElementById("send-command-btn")
      .addEventListener("click", () => {
        this.sendCommand();
      });

    // Quick command buttons
    document.querySelectorAll(".quick-cmd-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const command = e.target.dataset.cmd;
        this.sendQuickCommand(command);
      });
    });

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setLogFilter(e.target.dataset.level);
      });
    });

    // Calibration
    document
      .getElementById("calibrate-sensor-btn")
      .addEventListener("click", () => {
        this.calibrateSensor();
      });

    // Auto-scroll toggle
    this.elements.autoscrollIndicator.addEventListener("click", () => {
      this.toggleAutoScroll();
    });

    // Console scroll detection
    this.elements.consoleOutput.addEventListener("scroll", () => {
      this.checkAutoScroll();
    });
  }

  connectWebSocket() {
    try {
      this.log("🔌 Connecting to AGOS WebSocket...", "info");

      const wsUrl = `ws://${window.location.host}`;
      this.state.socket = new WebSocket(wsUrl);

      this.state.socket.onopen = () => {
        this.state.isConnected = true;
        this.updateConnectionStatus("connected");
        this.log("✅ WebSocket connected successfully", "info");

        // Request initial Arduino status
        this.sendSocketMessage({
          type: "arduino-console",
          action: "status",
        });
      };

      this.state.socket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.state.socket.onclose = () => {
        this.state.isConnected = false;
        this.updateConnectionStatus("disconnected");
        this.log("❌ WebSocket disconnected", "warning");

        // Attempt reconnection
        setTimeout(() => {
          if (!this.state.isConnected) {
            this.log("🔄 Attempting to reconnect...", "info");
            this.connectWebSocket();
          }
        }, this.config.RECONNECT_DELAY);
      };

      this.state.socket.onerror = (error) => {
        this.log(
          `❌ WebSocket error: ${error.message || "Connection failed"}`,
          "error"
        );
      };
    } catch (error) {
      this.log(`💥 Failed to connect: ${error.message}`, "error");
    }
  }

  disconnectWebSocket() {
    if (this.state.socket) {
      this.state.socket.close();
      this.state.isConnected = false;
      this.updateConnectionStatus("disconnected");
      this.log("🔌 WebSocket disconnected manually", "info");
    }
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "sensor-data":
          this.updateLiveReadings(data.data);
          break;

        case "arduino-response":
          this.log(`📥 Arduino: ${data.message}`, "info");
          break;

        case "arduino-error":
          this.log(`❌ Arduino Error: ${data.message}`, "error");
          break;

        case "system-log":
          this.log(`🔧 System: ${data.message}`, data.level || "debug");
          break;

        case "pong":
          this.handlePong();
          break;

        default:
          console.log("Unknown message type:", data);
      }
    } catch (error) {
      this.log(`💥 Error parsing message: ${error.message}`, "error");
    }
  }

  sendSocketMessage(message) {
    if (this.state.isConnected && this.state.socket) {
      this.state.socket.send(JSON.stringify(message));
    } else {
      this.log("❌ Cannot send message - not connected", "warning");
    }
  }

  sendCommand() {
    const command = this.elements.commandInput.value.trim();
    if (!command) return;

    this.log(`📤 Sending: ${command}`, "debug");

    this.sendSocketMessage({
      type: "arduino-command",
      command: command,
    });

    // Add to command history and clear input
    this.elements.commandInput.value = "";
  }

  sendQuickCommand(commandType) {
    let command;

    switch (commandType) {
      case "sensor_status":
        command = "SENSOR_STATUS";
        break;
      case "wifi_status":
        command = "WIFI_STATUS";
        break;
      case "gsm_status":
        command = "GSM_STATUS";
        break;
      case "battery_level":
        command = "BATTERY_LEVEL";
        break;
      case "memory_info":
        command = "MEMORY_INFO";
        break;
      case "reset_sensors":
        command = "RESET_SENSORS";
        break;
      case "debug_mode":
        command = "TOGGLE_DEBUG";
        break;
      case "sms_test":
        command = "SMS_TEST";
        break;
      default:
        command = commandType.toUpperCase();
    }

    this.log(`⚡ Quick command: ${command}`, "info");

    this.sendSocketMessage({
      type: "arduino-command",
      command: command,
    });
  }

  calibrateSensor() {
    const sensorType = this.elements.sensorType.value;
    const referenceValue = parseFloat(this.elements.referenceValue.value);
    const calibrationFactor = parseFloat(this.elements.calibrationFactor.value);

    if (isNaN(referenceValue) || isNaN(calibrationFactor)) {
      this.log("❌ Invalid calibration values", "error");
      return;
    }

    this.log(`🔧 Calibrating ${sensorType} sensor...`, "info");

    const calibrationCommand = `CALIBRATE_${sensorType.toUpperCase()}_${referenceValue}_${calibrationFactor}`;

    this.sendSocketMessage({
      type: "arduino-calibration",
      sensor: sensorType,
      reference: referenceValue,
      factor: calibrationFactor,
      command: calibrationCommand,
    });
  }

  updateLiveReadings(data) {
    this.elements.liveWaterLevel.textContent = `${
      data.waterLevel?.toFixed(1) || "--"
    } cm`;
    this.elements.liveFlowRate.textContent = `${
      data.flowRate?.toFixed(2) || "--"
    } m/s`;
    this.elements.liveUpstream.textContent = `${
      data.upstreamTurbidity?.toFixed(1) || "--"
    }%`;
    this.elements.liveDownstream.textContent = `${
      data.downstreamTurbidity?.toFixed(1) || "--"
    }%`;
    this.elements.liveBattery.textContent = `${data.batteryLevel || "--"}%`;

    // Simulate WiFi signal strength
    this.elements.liveWifiSignal.textContent = "-45 dBm";

    // Update Arduino status based on data freshness
    this.updateArduinoStatus("connected");
  }

  updateConnectionStatus(status) {
    if (status === "connected") {
      this.elements.websocketStatus.textContent = "Connected";
      this.elements.websocketStatus.style.color = "#22c55e";
    } else {
      this.elements.websocketStatus.textContent = "Disconnected";
      this.elements.websocketStatus.style.color = "#ef4444";
    }
  }

  updateArduinoStatus(status) {
    if (status === "connected") {
      this.elements.arduinoStatus.classList.add("connected");
      this.elements.arduinoStatusText.textContent = "Connected";
    } else {
      this.elements.arduinoStatus.classList.remove("connected");
      this.elements.arduinoStatusText.textContent = "Disconnected";
    }
  }

  log(message, level = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      level,
      id: Date.now(),
    };

    this.state.logBuffer.push(logEntry);

    // Limit log buffer size
    if (this.state.logBuffer.length > this.config.MAX_LOG_LINES) {
      this.state.logBuffer.shift();
    }

    // Display if matches current filter
    if (
      this.state.currentFilter === "all" ||
      this.state.currentFilter === level
    ) {
      this.displayLogEntry(logEntry);
    }
  }

  displayLogEntry(entry) {
    const logDiv = document.createElement("div");
    logDiv.className = "console-log";
    logDiv.innerHTML = `
            <span class="log-timestamp">[${entry.timestamp}]</span>
            <span class="log-level-${entry.level}">${entry.message}</span>
        `;

    this.elements.consoleOutput.appendChild(logDiv);

    // Auto-scroll if enabled
    if (this.state.autoScroll) {
      this.elements.consoleOutput.scrollTop =
        this.elements.consoleOutput.scrollHeight;
    }
  }

  setLogFilter(level) {
    this.state.currentFilter = level;

    // Update filter button states
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-level="${level}"]`).classList.add("active");

    // Rebuild console output
    this.rebuildConsoleOutput();

    this.log(`🔍 Filter set to: ${level}`, "debug");
  }

  rebuildConsoleOutput() {
    this.elements.consoleOutput.innerHTML = "";

    this.state.logBuffer.forEach((entry) => {
      if (
        this.state.currentFilter === "all" ||
        this.state.currentFilter === entry.level
      ) {
        this.displayLogEntry(entry);
      }
    });
  }

  clearConsole() {
    this.elements.consoleOutput.innerHTML = "";
    this.state.logBuffer = [];
    this.log("🧹 Console cleared", "info");
  }

  downloadLog() {
    const logText = this.state.logBuffer
      .map(
        (entry) =>
          `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `agos-arduino-log-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("📥 Log file downloaded", "info");
  }

  resetArduino() {
    if (
      confirm(
        "Are you sure you want to reset the Arduino? This will restart the device."
      )
    ) {
      this.log("🔄 Sending Arduino reset command...", "warning");

      this.sendSocketMessage({
        type: "arduino-command",
        command: "RESET_DEVICE",
      });
    }
  }

  toggleAutoScroll() {
    this.state.autoScroll = !this.state.autoScroll;

    const indicator = this.elements.autoscrollIndicator;
    indicator.innerHTML = `
            <i class="fas fa-arrow-down"></i>
            Auto-scroll: ${this.state.autoScroll ? "ON" : "OFF"}
        `;
    indicator.style.opacity = this.state.autoScroll ? "1" : "0.5";

    if (this.state.autoScroll) {
      this.elements.consoleOutput.scrollTop =
        this.elements.consoleOutput.scrollHeight;
    }
  }

  checkAutoScroll() {
    const output = this.elements.consoleOutput;
    const isAtBottom =
      output.scrollTop + output.clientHeight >= output.scrollHeight - 10;

    if (this.state.autoScroll && !isAtBottom) {
      this.state.autoScroll = false;
      this.toggleAutoScroll();
    }
  }

  startPingMonitoring() {
    setInterval(() => {
      if (this.state.isConnected) {
        this.sendPing();
      }
    }, this.config.PING_INTERVAL);
  }

  sendPing() {
    this.state.lastPing = Date.now();
    this.sendSocketMessage({
      type: "ping",
      timestamp: this.state.lastPing,
    });
  }

  handlePong() {
    if (this.state.lastPing) {
      this.state.pingTime = Date.now() - this.state.lastPing;
      this.elements.pingValue.textContent = `${this.state.pingTime} ms`;
    }
  }
}

// Initialize console when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.arduinoConsole = new ArduinoConsole();
});

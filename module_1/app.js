/**
 * AGOS - Advanced Ground Observation System
 * Module 1: Real-Time Sensor Dashboard
 *
 * Critical flood monitoring system for Philippine rivers
 * Author: Senior IoT Engineer
 * Date: 2025-08-18
 */

class AGOSSystem {
  constructor() {
    // System configuration object - Contains all operational parameters
    this.config = {
      // Sensor update intervals - How often to refresh sensor data
      SENSOR_UPDATE_INTERVAL: 5000, // 5 seconds - Frequency for reading Arduino sensors
      RECONNECT_INTERVAL: 3000, // 3 seconds - Wait time between connection attempts
      MAX_RECONNECT_ATTEMPTS: 10, // Maximum retries before giving up on connection

      // Emergency thresholds (configurable based on river characteristics)
      ALERT_LEVEL: 100, // cm - Yellow alert when water reaches 1 meter
      EMERGENCY_LEVEL: 150, // cm - Red alert at 1.5 meters (flood conditions)
      CRITICAL_FLOW: 1.2, // m/s - Dangerous flow rate threshold

      // System operational limits (hardware constraints)
      MAX_WATER_LEVEL: 300, // cm - Maximum sensor range (3 meters)
      MAX_FLOW_RATE: 5.0, // m/s - Maximum flow rate the sensors can detect

      // Battery management thresholds
      BATTERY_LOW: 20, // % - Low battery warning level
      BATTERY_CRITICAL: 10, // % - Critical battery level requiring immediate action
    };

    // System state object - Tracks current operational status and sensor readings
    this.state = {
      isConnected: false, // WebSocket connection status to backend server
      isSimulating: false, // Whether we're running simulated data (for testing)
      reconnectAttempts: 0, // Counter for connection retry attempts
      lastUpdate: null, // Timestamp of most recent sensor data
      emergencyActive: false, // Flag indicating if emergency alert is active

      // Real-time sensor data from Arduino hardware
      waterLevel: 0.0, // cm - From optical encoder on float system
      flowRate: 0.0, // m/s - Calculated from POF turbidity sensors
      upstreamTurbidity: 0.0, // Upstream POF sensor reading (normalized 0-1)
      downstreamTurbidity: 0.0, // Downstream POF sensor reading (normalized 0-1)
      batteryLevel: 85, // % - Solar battery charge level from voltage divider

      // Hardware health monitoring
      levelSensorHealth: true, // Omron optical encoder status
      flowSensorHealth: true, // POF sensor system status
      gsmSignal: "Good", // SIM800L signal strength
    };

    // WebSocket connection object for real-time communication with backend
    this.socket = null; // Will hold WebSocket connection instance
    this.reconnectTimer = null; // Timer for automatic reconnection attempts

    // DOM element cache for performance - Store references to HTML elements
    this.elements = {}; // Object to hold all DOM element references

    // Animation and visual effects management
    this.animationFrameId = null; // ID for requestAnimationFrame (smooth animations)
    this.particleSystem = null; // Object controlling flow visualization particles

    // Initialize the entire system - Entry point for application startup
    this.init();
  }

  /*
   * Editor guidance - protected element IDs used throughout this file.
   * Do not rename or remove these IDs in the HTML or CSS unless you also
   * update the references below in this JavaScript file.
   * - water-level-value, water-level-status, water-flow-value, water-flow-status
   * - water-fill, water-surface, battery-level, last-update, connection-status
   * - level-sensor-health, flow-sensor-health, upstream-turbidity, downstream-turbidity
   * - flow-velocity, debris-status, turbidity-diff, emergency-banner, emergency-level
   * - human-height, car-height, human-ref, car-ref, alert-threshold, emergency-threshold
   * - simulate-btn, reset-btn, export-btn, ws-status, flow-particles
   */

  /**
   * Safe DOM helper - set textContent of an element only if it exists.
   * Use this helper when updating UI text to avoid runtime errors if an
   * element is missing (e.g., during iterative edits to HTML/CSS).
   */
  safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * Initialize the AGOS system
   */
  init() {
    console.log("🌊 AGOS System Initializing...");

    try {
      this.cacheElements();
      this.setupEventListeners();
      this.initializeWebSocket();
      this.startSystemMonitoring();
      this.initializeFlowParticles();

      // Update reference object positions
      this.updateReferencePositions();

      console.log("✅ AGOS System Initialized Successfully");
      this.updateSystemStatus("System Ready");
    } catch (error) {
      console.error("❌ AGOS Initialization Failed:", error);
      this.handleSystemError(error);
    }
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    const elements = [
      "water-level-value",
      "water-level-status",
      "water-flow-value",
      "water-flow-status",
      "water-fill",
      "water-surface",
      "battery-level",
      "last-update",
      "connection-status",
      "level-sensor-health",
      "flow-sensor-health",
      "upstream-turbidity",
      "downstream-turbidity",
      "flow-velocity",
      "debris-status",
      "turbidity-diff",
      "emergency-banner",
      "emergency-level",
      "human-height",
      "car-height",
      "human-ref",
      "car-ref",
      "alert-threshold",
      "emergency-threshold",
      "simulate-btn",
      "reset-btn",
      "export-btn",
      "ws-status",
      "flow-particles",
    ];

    elements.forEach((id) => {
      this.elements[id] = document.getElementById(id);
      if (!this.elements[id]) {
        console.warn(`⚠️ Element not found: ${id}`);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Control buttons
    this.elements["simulate-btn"]?.addEventListener("click", () =>
      this.toggleSimulation()
    );
    this.elements["reset-btn"]?.addEventListener("click", () =>
      this.resetSystem()
    );
    this.elements["export-btn"]?.addEventListener("click", () =>
      this.exportData()
    );

    // Reference height changes
    this.elements["human-height"]?.addEventListener("input", () =>
      this.updateReferencePositions()
    );
    this.elements["car-height"]?.addEventListener("input", () =>
      this.updateReferencePositions()
    );

    // Show/hide reference visuals
    const humanToggle = document.getElementById("human-toggle");
    if (humanToggle) {
      humanToggle.addEventListener("change", (e) => {
        const humanVisual = document.getElementById("human-visual");
        if (humanVisual) {
          if (e.target.checked) humanVisual.classList.remove("hidden");
          else humanVisual.classList.add("hidden");
          this.updateReferencePositions();
        }
      });
    }

    // Threshold changes
    this.elements["alert-threshold"]?.addEventListener("change", (e) => {
      this.config.ALERT_LEVEL = parseInt(e.target.value);
      this.updateWaterLevelDisplay();
    });

    this.elements["emergency-threshold"]?.addEventListener("change", (e) => {
      this.config.EMERGENCY_LEVEL = parseInt(e.target.value);
      this.updateWaterLevelDisplay();
    });

    // Window events
    window.addEventListener("beforeunload", () => this.cleanup());
    window.addEventListener("online", () => this.handleNetworkOnline());
    window.addEventListener("offline", () => this.handleNetworkOffline());

    // Visibility change (for power management)
    document.addEventListener("visibilitychange", () =>
      this.handleVisibilityChange()
    );
  }

  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket() {
    try {
      console.log("🔌 Initializing WebSocket connection...");

      // Create real WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("✅ WebSocket connected");
        this.handleSocketConnect();
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "sensor-data") {
          // Update state with real Arduino data
          this.state.waterLevel = parseFloat(message.data.waterLevel) || 0;
          this.state.flowRate = parseFloat(message.data.flowRate) || 0;
          this.state.batteryLevel =
            parseFloat(message.data.batteryLevel) || 100;
          this.state.lastUpdate = new Date(message.data.timestamp);

          console.log(`🤖 Arduino water level: ${this.state.waterLevel}cm`);

          // Update the visualization
          this.updateAllDisplays();
        }
      };

      this.socket.onclose = () => {
        console.log("⚠️ WebSocket disconnected");
        this.handleSocketDisconnect();
      };

      this.socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.handleSocketError(error);
      };
    } catch (error) {
      console.error("❌ WebSocket initialization failed:", error);
      this.handleSocketError(error);
    }
  }

  /**
   * Handle WebSocket connection
   */
  handleSocketConnect() {
    console.log("✅ WebSocket connected");
    this.state.isConnected = true;
    this.state.reconnectAttempts = 0;

    this.updateConnectionStatus(true);
    this.clearReconnectTimer();

    // Request initial data
    this.requestSensorData();
  }

  /**
   * Handle WebSocket disconnection
   */
  handleSocketDisconnect() {
    console.log("⚠️ WebSocket disconnected");
    this.state.isConnected = false;
    this.updateConnectionStatus(false);

    if (this.state.reconnectAttempts < this.config.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    } else {
      this.handleConnectionFailure();
    }
  }

  /**
   * Handle WebSocket error
   */
  handleSocketError(error) {
    console.error("❌ WebSocket error:", error);
    this.updateSystemStatus(`Connection Error: ${error.message}`);
    this.handleSocketDisconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.state.reconnectAttempts++;
    console.log(
      `🔄 Scheduling reconnect attempt ${this.state.reconnectAttempts}/${this.config.MAX_RECONNECT_ATTEMPTS}`
    );

    this.reconnectTimer = setTimeout(() => {
      this.initializeWebSocket();
    }, this.config.RECONNECT_INTERVAL * this.state.reconnectAttempts);
  }

  /**
   * Clear reconnection timer
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    // Update system time every second
    setInterval(() => {
      this.updateSystemTime();
    }, 1000);

    // Check sensor data updates
    setInterval(() => {
      this.checkDataFreshness();
    }, this.config.SENSOR_UPDATE_INTERVAL);

    // System health check
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Toggle simulation mode
   */
  toggleSimulation() {
    this.state.isSimulating = !this.state.isSimulating;

    const btn = this.elements["simulate-btn"];
    if (this.state.isSimulating) {
      btn.textContent = "⏹️ Stop Simulation";
      btn.classList.add("active");
      this.startSimulation();
    } else {
      btn.textContent = "🔄 Start Simulation";
      btn.classList.remove("active");
      this.stopSimulation();
    }
  }

  /**
   * Start sensor data simulation
   */
  startSimulation() {
    console.log("🎯 Starting sensor simulation...");

    this.simulationInterval = setInterval(() => {
      this.generateSimulatedData();
      this.updateAllDisplays();
    }, this.config.SENSOR_UPDATE_INTERVAL);
  }

  /**
   * Stop sensor data simulation
   */
  stopSimulation() {
    console.log("⏹️ Stopping sensor simulation...");

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Generate simulated sensor data
   */
  generateSimulatedData() {
    const time = Date.now() / 1000;
    const baseLevel = 50;
    const baseFlow = 0.5;

    // Simulate water level with some variability and trends
    const levelVariation = Math.sin(time * 0.001) * 20 + Math.random() * 10 - 5;
    this.state.waterLevel = Math.max(
      0,
      Math.min(this.config.MAX_WATER_LEVEL, baseLevel + levelVariation)
    );

    // Simulate flow rate correlated with water level
    const flowVariation =
      Math.sin(time * 0.002) * 1.0 + Math.random() * 0.3 - 0.15;
    this.state.flowRate = Math.max(
      0,
      Math.min(
        this.config.MAX_FLOW_RATE,
        baseFlow + this.state.waterLevel / 100 + flowVariation
      )
    );

    // Simulate turbidity sensors
    this.state.upstreamTurbidity = 0.3 + Math.random() * 0.4;
    this.state.downstreamTurbidity =
      this.state.upstreamTurbidity + (Math.random() * 0.2 - 0.1);

    // Simulate battery discharge
    this.state.batteryLevel = Math.max(
      0,
      this.state.batteryLevel - Math.random() * 0.01
    );

    // Update timestamp
    this.state.lastUpdate = new Date();

    // Simulate occasional sensor issues
    if (Math.random() < 0.01) {
      // 1% chance
      this.state.levelSensorHealth = Math.random() > 0.5;
      this.state.flowSensorHealth = Math.random() > 0.5;
    }

    // Simulate emergency conditions occasionally
    if (Math.random() < 0.05) {
      // 5% chance
      if (Math.random() > 0.7) {
        this.state.waterLevel = this.config.ALERT_LEVEL + Math.random() * 50;
      }
    }
  }

  /**
   * Request sensor data from backend
   */
  requestSensorData() {
    if (this.socket && this.state.isConnected) {
      this.socket.emit("requestSensorData", {
        timestamp: Date.now(),
        stationId: "AGOS-001",
      });
    }
  }

  /**
   * Update all display elements
   */
  updateAllDisplays() {
    this.updateWaterLevelDisplay();
    this.updateFlowDisplay();
    this.updateSystemHealth();
    this.updateEmergencyStatus();
    this.updateFlowAnimation();
  }

  /**
   * Update water level display
   */
  updateWaterLevelDisplay() {
    const level = this.state.waterLevel;
    const valueElement = this.elements["water-level-value"];
    const statusElement = this.elements["water-level-status"];
    const fillElement = this.elements["water-fill"];
    const surfaceElement = this.elements["water-surface"];

    // Update numeric display
    if (valueElement) {
      valueElement.textContent = level.toFixed(2);
    }

    // Determine status and color
    let status, statusClass, color;
    if (level >= this.config.EMERGENCY_LEVEL) {
      status = "EMERGENCY";
      statusClass = "status-emergency";
      color = "var(--emergency-color)";
    } else if (level >= this.config.ALERT_LEVEL) {
      status = "ALERT";
      statusClass = "status-alert";
      color = "var(--alert-color)";
    } else if (level >= this.config.ALERT_LEVEL * 0.8) {
      status = "WATCH";
      statusClass = "status-watch";
      color = "var(--watch-color)";
    } else {
      status = "NORMAL";
      statusClass = "status-normal";
      color = "var(--normal-color)";
    }

    // Update status display
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `level-status ${statusClass}`;
    }

    // Update value color
    if (valueElement) {
      valueElement.style.color = color;
    }

    // Update water fill animation
    const fillPercentage = Math.min(
      100,
      (level / this.config.MAX_WATER_LEVEL) * 100
    );
    if (fillElement) {
      fillElement.style.height = `${fillPercentage}%`;
    }
    if (surfaceElement) {
      surfaceElement.style.bottom = `${fillPercentage}%`;
    }
  }

  /**
   * Update flow display
   */
  updateFlowDisplay() {
    const flow = this.state.flowRate;
    const valueElement = this.elements["water-flow-value"];
    const statusElement = this.elements["water-flow-status"];
    const velocityElement = this.elements["flow-velocity"];
    const upstreamElement = this.elements["upstream-turbidity"];
    const downstreamElement = this.elements["downstream-turbidity"];
    const diffElement = this.elements["turbidity-diff"];
    const debrisElement = this.elements["debris-status"];

    // Update numeric display
    if (valueElement) {
      valueElement.textContent = flow.toFixed(2);
    }

    if (velocityElement) {
      velocityElement.textContent = `${flow.toFixed(2)} m/s`;
    }

    // Update turbidity values
    if (upstreamElement) {
      upstreamElement.textContent = this.state.upstreamTurbidity.toFixed(1);
    }
    if (downstreamElement) {
      downstreamElement.textContent = this.state.downstreamTurbidity.toFixed(1);
    }

    // Calculate turbidity difference
    const turbidityDiff =
      ((this.state.downstreamTurbidity - this.state.upstreamTurbidity) /
        this.state.upstreamTurbidity) *
      100;
    if (diffElement) {
      diffElement.textContent = `${turbidityDiff.toFixed(1)}%`;
    }

    // Determine flow status
    let status, statusClass, color;
    if (flow >= this.config.CRITICAL_FLOW) {
      status = "CRITICAL";
      statusClass = "status-critical";
      color = "var(--critical-color)";
    } else if (flow >= this.config.CRITICAL_FLOW * 0.8) {
      status = "HIGH";
      statusClass = "status-alert";
      color = "var(--alert-color)";
    } else if (flow >= this.config.CRITICAL_FLOW * 0.5) {
      status = "MODERATE";
      statusClass = "status-watch";
      color = "var(--watch-color)";
    } else {
      status = "NORMAL";
      statusClass = "status-normal";
      color = "var(--normal-color)";
    }

    // Update status display
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `flow-status ${statusClass}`;
    }

    // Update value color
    if (valueElement) {
      valueElement.style.color = color;
    }

    // Debris detection based on turbidity difference
    if (debrisElement) {
      const isDebrisDetected = Math.abs(turbidityDiff) > 15;
      debrisElement.textContent = isDebrisDetected ? "DETECTED" : "CLEAR";
      debrisElement.style.color = isDebrisDetected
        ? "var(--alert-color)"
        : "var(--normal-color)";
    }
  }

  /**
   * Update system health indicators
   */
  updateSystemHealth() {
    const batteryElement = this.elements["battery-level"];
    const levelHealthElement = this.elements["level-sensor-health"];
    const flowHealthElement = this.elements["flow-sensor-health"];

    // Update battery status
    if (batteryElement) {
      const battery = this.state.batteryLevel;
      batteryElement.textContent = `${battery.toFixed(0)}%`;

      // Battery color coding
      let batteryColor;
      if (battery <= this.config.BATTERY_CRITICAL) {
        batteryColor = "var(--critical-color)";
      } else if (battery <= this.config.BATTERY_LOW) {
        batteryColor = "var(--alert-color)";
      } else {
        batteryColor = "var(--normal-color)";
      }
      batteryElement.style.color = batteryColor;
    }

    // Update sensor health indicators
    if (levelHealthElement) {
      levelHealthElement.textContent = this.state.levelSensorHealth
        ? "�"
        : "🔴";
    }
    if (flowHealthElement) {
      flowHealthElement.textContent = this.state.flowSensorHealth ? "🟢" : "🔴";
    }
  }

  /**
   * Update emergency status
   */
  updateEmergencyStatus() {
    const isEmergency =
      this.state.waterLevel >= this.config.EMERGENCY_LEVEL ||
      this.state.flowRate >= this.config.CRITICAL_FLOW;

    if (isEmergency && !this.state.emergencyActive) {
      this.activateEmergencyAlert();
    } else if (!isEmergency && this.state.emergencyActive) {
      this.deactivateEmergencyAlert();
    }
  }

  /**
   * Activate emergency alert
   */
  activateEmergencyAlert() {
    console.log("🚨 EMERGENCY ALERT ACTIVATED");
    this.state.emergencyActive = true;

    const banner = this.elements["emergency-banner"];
    const levelElement = this.elements["emergency-level"];

    if (banner) {
      banner.classList.remove("hidden");
    }

    if (levelElement) {
      if (this.state.waterLevel >= this.config.EMERGENCY_LEVEL) {
        levelElement.textContent = `FLOOD LEVEL: ${this.state.waterLevel.toFixed(
          0
        )}cm`;
      } else if (this.state.flowRate >= this.config.CRITICAL_FLOW) {
        levelElement.textContent = `CRITICAL FLOW: ${this.state.flowRate.toFixed(
          1
        )}m/s`;
      }
    }

    // Play alert sound (browser API)
    this.playAlertSound();

    // Log emergency event
    this.logEmergencyEvent("EMERGENCY_ACTIVATED", {
      waterLevel: this.state.waterLevel,
      flowRate: this.state.flowRate,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Deactivate emergency alert
   */
  deactivateEmergencyAlert() {
    console.log("✅ Emergency alert deactivated");
    this.state.emergencyActive = false;

    const banner = this.elements["emergency-banner"];
    if (banner) {
      banner.classList.add("hidden");
    }

    // Log emergency clear event
    this.logEmergencyEvent("EMERGENCY_CLEARED", {
      waterLevel: this.state.waterLevel,
      flowRate: this.state.flowRate,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Play alert sound
   */
  playAlertSound() {
    try {
      // Create audio context for emergency beep
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800Hz beep
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("⚠️ Could not play alert sound:", error);
    }
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(connected) {
    const statusElement = this.elements["connection-status"];
    const wsStatusElement = this.elements["ws-status"];

    if (statusElement) {
      this.safeSetText("connection-status", connected ? "🟢" : "🔴");
    }

    if (wsStatusElement) {
      this.safeSetText("ws-status", connected ? "Connected" : "Disconnected");
      wsStatusElement.style.color = connected
        ? "var(--normal-color)"
        : "var(--emergency-color)";
    }
  }

  /**
   * Update system time display
   */
  updateSystemTime() {
    const lastUpdateElement = this.elements["last-update"];
    if (!this.state.lastUpdate) return;
    const now = new Date();
    const diff = Math.floor((now - this.state.lastUpdate) / 1000);
    let text;
    if (diff < 60) {
      text = `${diff}s ago`;
    } else if (diff < 3600) {
      text = `${Math.floor(diff / 60)}m ago`;
    } else {
      text = `${Math.floor(diff / 3600)}h ago`;
    }
    this.safeSetText("last-update", text);
  }

  /**
   * Update reference object positions
   */
  updateReferencePositions() {
    const humanHeight = parseInt(this.elements["human-height"]?.value) || 170;
    const carHeight = parseInt(this.elements["car-height"]?.value) || 150;

    const humanRef = this.elements["human-ref"];
    const carRef = this.elements["car-ref"];

    if (humanRef) {
      const humanBottom = (1 - humanHeight / this.config.MAX_WATER_LEVEL) * 100;
      humanRef.style.bottom = `${Math.max(0, Math.min(100, humanBottom))}%`;
    }

    if (carRef) {
      const carBottom = (1 - carHeight / this.config.MAX_WATER_LEVEL) * 100;
      carRef.style.bottom = `${Math.max(0, Math.min(100, carBottom))}%`;
    }

    // Position the human-visual marker inside the water visualization if present
    const humanVisual = document.getElementById("human-visual");
    const humanToggle = document.getElementById("human-toggle");
    if (humanVisual && humanToggle && humanToggle.checked) {
      const humanBottom = (1 - humanHeight / this.config.MAX_WATER_LEVEL) * 100;
      // The visual is positioned relative to the water-level-visual container
      humanVisual.style.bottom = `${Math.max(0, Math.min(100, humanBottom))}%`;
    }
  }

  /**
   * Initialize flow particle system
   */
  initializeFlowParticles() {
    const particlesContainer = this.elements["flow-particles"];
    if (!particlesContainer) return;

    // Create particle elements
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.className = "flow-particle";
      particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: var(--water-color);
                border-radius: 50%;
                opacity: 0;
                top: ${Math.random() * 80 + 10}%;
                left: -10px;
            `;
      particlesContainer.appendChild(particle);
    }

    this.particleSystem = {
      particles: particlesContainer.querySelectorAll(".flow-particle"),
      container: particlesContainer,
    };
  }

  /**
   * Update flow animation based on flow rate
   */
  updateFlowAnimation() {
    if (!this.particleSystem) return;

    const flowRate = this.state.flowRate;
    const particles = this.particleSystem.particles;

    particles.forEach((particle, index) => {
      const delay = index * 200; // Stagger particles
      const speed = Math.max(0.5, flowRate) * 2; // Animation speed

      // Reset particle position and animate
      setTimeout(() => {
        particle.style.transition = "none";
        particle.style.left = "-10px";
        particle.style.opacity = flowRate > 0.1 ? "0.8" : "0";

        setTimeout(() => {
          particle.style.transition = `left ${3 / speed}s linear`;
          particle.style.left = "calc(100% + 10px)";
        }, 50);
      }, delay);
    });

    // Update flow arrow animation speed
    const flowArrows = document.querySelectorAll(".flow-arrow");
    flowArrows.forEach((arrow) => {
      const animationDuration = Math.max(0.5, 2 - flowRate);
      arrow.style.animationDuration = `${animationDuration}s`;
    });
  }

  /**
   * Check data freshness
   */
  checkDataFreshness() {
    if (!this.state.lastUpdate) return;

    const now = new Date();
    const dataAge = (now - this.state.lastUpdate) / 1000;
    const maxAge = (this.config.SENSOR_UPDATE_INTERVAL / 1000) * 3; // 3x update interval

    if (dataAge > maxAge && this.state.isConnected) {
      console.warn("⚠️ Sensor data is stale");
      this.handleStaleData();
    }
  }

  /**
   * Handle stale data
   */
  handleStaleData() {
    this.updateSystemStatus("Sensor data timeout");

    // Mark sensors as potentially unhealthy
    this.state.levelSensorHealth = false;
    this.state.flowSensorHealth = false;

    // Try to reconnect
    if (this.state.isConnected) {
      this.requestSensorData();
    }
  }

  /**
   * Perform system health check
   */
  performHealthCheck() {
    const issues = [];

    // Check battery level
    if (this.state.batteryLevel <= this.config.BATTERY_CRITICAL) {
      issues.push("Critical battery level");
    }

    // Check sensor health
    if (!this.state.levelSensorHealth) {
      issues.push("Water level sensor fault");
    }
    if (!this.state.flowSensorHealth) {
      issues.push("Flow sensor fault");
    }

    // Check connection
    if (!this.state.isConnected) {
      issues.push("Communication failure");
    }

    // Log issues
    if (issues.length > 0) {
      console.warn("🔧 System health issues:", issues);
      this.updateSystemStatus(`Issues: ${issues.length}`);
    } else {
      this.updateSystemStatus("System healthy");
    }
  }

  /**
   * Reset system
   */
  resetSystem() {
    console.log("🔄 Resetting AGOS system...");

    // Stop simulation if running
    this.stopSimulation();

    // Reset state
    this.state.waterLevel = 0.0;
    this.state.flowRate = 0.0;
    this.state.upstreamTurbidity = 0.0;
    this.state.downstreamTurbidity = 0.0;
    this.state.batteryLevel = 85;
    this.state.levelSensorHealth = true;
    this.state.flowSensorHealth = true;
    this.state.lastUpdate = new Date();

    // Deactivate emergency
    if (this.state.emergencyActive) {
      this.deactivateEmergencyAlert();
    }

    // Update all displays
    this.updateAllDisplays();

    // Reset simulation button
    const btn = this.elements["simulate-btn"];
    if (btn) {
      btn.textContent = "🔄 Start Simulation";
      btn.classList.remove("active");
    }

    console.log("✅ System reset complete");
  }

  /**
   * Export data for analysis
   */
  exportData() {
    console.log("📊 Exporting system data...");

    const exportData = {
      timestamp: new Date().toISOString(),
      stationId: "AGOS-001",
      location: "Philippine River Monitoring Station",
      currentReadings: {
        waterLevel: this.state.waterLevel,
        flowRate: this.state.flowRate,
        upstreamTurbidity: this.state.upstreamTurbidity,
        downstreamTurbidity: this.state.downstreamTurbidity,
        batteryLevel: this.state.batteryLevel,
      },
      systemHealth: {
        levelSensorHealth: this.state.levelSensorHealth,
        flowSensorHealth: this.state.flowSensorHealth,
        connectionStatus: this.state.isConnected,
        emergencyActive: this.state.emergencyActive,
      },
      configuration: {
        alertLevel: this.config.ALERT_LEVEL,
        emergencyLevel: this.config.EMERGENCY_LEVEL,
        criticalFlow: this.config.CRITICAL_FLOW,
      },
    };

    // Create and download JSON file
    const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agos-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log("✅ Data exported successfully");
  }

  /**
   * Handle network online event
   */
  handleNetworkOnline() {
    console.log("🌐 Network connection restored");
    if (!this.state.isConnected) {
      this.initializeWebSocket();
    }
  }

  /**
   * Handle network offline event
   */
  handleNetworkOffline() {
    console.log("📵 Network connection lost");
    this.updateConnectionStatus(false);
    this.updateSystemStatus("Offline mode");
  }

  /**
   * Handle visibility change (power management)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log("🔋 Entering power save mode");
      // Reduce update frequency when not visible
    } else {
      console.log("👁️ Resuming normal operation");
      // Resume normal updates
      this.requestSensorData();
    }
  }

  /**
   * Log emergency events
   */
  logEmergencyEvent(eventType, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: eventType,
      stationId: "AGOS-001",
      data: data,
    };

    console.log("📝 Emergency event logged:", logEntry);

    // In production, send to backend for storage and SMS alerts
    if (this.socket && this.state.isConnected) {
      this.socket.emit("emergencyEvent", logEntry);
    }
  }

  /**
   * Update system status message
   */
  updateSystemStatus(message) {
    console.log(`ℹ️ System status: ${message}`);
    // Could display in a status bar if needed
  }

  /**
   * Handle connection failure
   */
  handleConnectionFailure() {
    console.error("❌ Connection failed permanently");
    this.updateSystemStatus("Connection failed - Operating offline");

    // Switch to offline mode
    this.state.isConnected = false;
    this.updateConnectionStatus(false);
  }

  /**
   * Handle system errors
   */
  handleSystemError(error) {
    console.error("💥 System error:", error);
    this.updateSystemStatus(`System error: ${error.message}`);

    // Try to maintain basic functionality
    try {
      this.updateAllDisplays();
    } catch (displayError) {
      console.error("💥 Display update failed:", displayError);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log("🧹 Cleaning up AGOS system...");

    this.stopSimulation();
    this.clearReconnectTimer();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log("✅ AGOS system cleanup completed");
  }
}

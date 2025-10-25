/**
 * AGOS Module 4: Emergency Response Control Panel
 * Enhanced version with sensor data integration and SMS alerts
 *
 * Author: cri-kee-zel
 * Date: 2025-08-18
 */

class AGOSEmergencySystem {
  constructor() {
    this.config = {
      ACCESS_CODES: {
        "agos-admin": "agosadmin2025",
      },
    };

    this.state = {
      operatorLoggedIn: false,
      currentOperator: null,
      operatorRole: null,
      systemStatus: "initializing",

      // Real-time sensor data from Arduino
      sensorData: {
        waterLevel: 0.0,
        flowRate: 0.0,
        upstreamTurbidity: 0.0,
        downstreamTurbidity: 0.0,
        batteryLevel: 85,
        alertStatus: "NORMAL",
        lastUpdate: null,
        emergencyActive: false,
      },

      // SMS Recipients Management
      recipients: [],
      recipientCount: 0,
    };

    this.elements = {};
    this.socket = null; // WebSocket connection

    // Global Alert Cooldown System (3 minutes)
    this.globalAlertCooldown = {
      active: false,
      endTime: null,
      intervalId: null,
    };

    this.alertButtonElements = {};
    this.originalButtonTexts = {
      "flash-flood": "🚨 SEND NOW",
      "flood-watch": "📢 SEND ALERT",
      "weather-update": "📰 SEND UPDATE",
      "all-clear": "✅ SEND CLEAR",
    };

    console.log("📱 AGOS Emergency Response System initialized");
    this.initializeSystem();
  }

  async initializeSystem() {
    try {
      console.log("🚀 Starting emergency response system...");

      // Ensure dashboard is hidden initially
      const mainContent = document.querySelector(".emergency-dashboard");
      if (mainContent) {
        mainContent.style.display = "none";
      }

      this.setupDOM();
      this.setupEventHandlers();
      this.showAuthModal();
      console.log("✅ Emergency response system ready");
    } catch (error) {
      console.error("💥 System initialization failed:", error);
    }
  }

  initializeWebSocket() {
    try {
      console.log(
        "🔌 Initializing WebSocket connection for emergency system..."
      );

      const wsUrl = `ws://${window.location.host}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("✅ Emergency WebSocket connected");
        // Reset reconnection counter on successful connection
        this.reconnectionAttempts = 0;
        this.isReconnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "sensor-data") {
            this.updateSensorData(data.data);
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("❌ Emergency WebSocket disconnected");

        // Only reconnect if not manually logged out
        if (this.state.operatorLoggedIn && !this.isReconnecting) {
          this.reconnectionAttempts = (this.reconnectionAttempts || 0) + 1;

          // Max 10 reconnection attempts
          if (this.reconnectionAttempts <= 10) {
            this.isReconnecting = true;

            // Exponential backoff: 3s, 6s, 12s, etc. (max 30s)
            const delay = Math.min(3000 * this.reconnectionAttempts, 30000);

            console.log(
              `🔄 Attempting to reconnect WebSocket (attempt ${
                this.reconnectionAttempts
              }/10) in ${delay / 1000}s...`
            );

            setTimeout(() => {
              this.isReconnecting = false;
              this.initializeWebSocket();
            }, delay);
          } else {
            console.log(
              "❌ Max reconnection attempts reached. Please refresh the page."
            );
            alert(
              "WebSocket connection lost. Please refresh the page to reconnect."
            );
          }
        }
      };

      this.socket.onerror = (error) => {
        console.error("❌ Emergency WebSocket error:", error);
      };
    } catch (error) {
      console.error("❌ WebSocket initialization failed:", error);
    }
  }

  updateSensorData(newData) {
    // Update local sensor data state
    this.state.sensorData = {
      waterLevel: newData.waterLevel || 0.0,
      flowRate: newData.flowRate || 0.0,
      upstreamTurbidity: newData.upstreamTurbidity || 0.0,
      downstreamTurbidity: newData.downstreamTurbidity || 0.0,
      batteryLevel: newData.batteryLevel || 85,
      alertStatus: this.determineAlertStatus(newData),
      lastUpdate: new Date(),
      emergencyActive: newData.emergencyActive || false,
    };

    // No UI update needed - Module 1 handles sensor display
    console.log("📊 Sensor data updated:", this.state.sensorData);
  }

  determineAlertStatus(data) {
    // Updated thresholds to match Arduino sensor heights (inches)
    // 37" = Flash Flood, 19" = Flood Watch, 10" = Advisory
    if (data.waterLevel >= 37.0) {
      return "EMERGENCY"; // Flash Flood level
    } else if (data.waterLevel >= 19.0) {
      return "ALERT"; // Flood Watch level
    } else if (data.waterLevel >= 10.0) {
      return "WARNING"; // Advisory level
    } else {
      return "NORMAL";
    }
  }

  // Sensor display removed - Module 1 handles this functionality
  // Module 4 focuses on emergency response and SMS alerts only

  // Phone Number Management Methods
  async loadRecipients() {
    try {
      console.log("📱 Loading SMS recipients from server...");
      console.log("🔗 Fetching from: /api/sms-recipients");

      const response = await fetch("/api/sms-recipients");
      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📄 Response data:", data);

      if (data.success) {
        this.state.recipients = data.recipients;
        this.state.recipientCount = data.count;
        this.updateRecipientsDisplay();
        console.log(`✅ Loaded ${data.count} recipients:`, data.recipients);
      } else {
        console.error("❌ Failed to load recipients:", data.error);
        alert(
          "Failed to load SMS recipients: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("❌ Error loading recipients:", error);
      alert("Error loading SMS recipients: " + error.message);
    }
  }

  async addRecipient(phoneNumber) {
    try {
      console.log("📱 Adding new recipient:", phoneNumber);
      console.log("🔗 Posting to: /api/sms-recipients");

      const response = await fetch("/api/sms-recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });

      console.log(
        "📡 Add response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📄 Add response data:", data);

      if (data.success) {
        this.state.recipients = data.recipients;
        this.state.recipientCount = data.count;
        this.updateRecipientsDisplay();
        console.log("✅ Recipient added successfully");
        return { success: true, message: "Phone number added successfully!" };
      } else {
        console.error("❌ Failed to add recipient:", data.error);
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("❌ Error adding recipient:", error);
      return {
        success: false,
        message: "Failed to add recipient: " + error.message,
      };
    }
  }

  async deleteRecipient(phoneNumber) {
    try {
      console.log("🗑️ Deleting recipient:", phoneNumber);

      const response = await fetch("/api/sms-recipients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        this.state.recipients = data.recipients;
        this.state.recipientCount = data.count;
        this.updateRecipientsDisplay();
        console.log("✅ Recipient deleted successfully");
        return { success: true, message: "Phone number deleted successfully!" };
      } else {
        console.error("❌ Failed to delete recipient:", data.error);
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("❌ Error deleting recipient:", error);
      return { success: false, message: "Failed to delete recipient" };
    }
  }

  validatePhoneNumber(phoneNumber) {
    // Remove any spaces
    phoneNumber = phoneNumber.trim();

    // Check international format: +[country code][number]
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(phoneNumber);
  }

  updateRecipientsDisplay() {
    console.log("🎨 Updating recipients display...");
    console.log("📊 Current state:", {
      recipients: this.state.recipients,
      count: this.state.recipients.length,
    });

    const recipientsList = document.getElementById("recipients-list");
    const recipientCount = document.getElementById("recipient-count");

    console.log("🔍 DOM elements found:", {
      recipientsList: !!recipientsList,
      recipientCount: !!recipientCount,
    });

    if (recipientsList) {
      recipientsList.innerHTML = "";

      if (this.state.recipients.length === 0) {
        recipientsList.innerHTML =
          '<div class="no-recipients">No SMS recipients configured</div>';
        console.log("📝 Showing 'no recipients' message");
      } else {
        console.log("📝 Rendering recipients list...");
        this.state.recipients.forEach((phoneNumber, index) => {
          const recipientDiv = document.createElement("div");
          recipientDiv.className = "recipient-item";
          recipientDiv.innerHTML = `
            <span class="phone-number">${phoneNumber}</span>
            <button class="delete-recipient-btn" data-phone="${phoneNumber}">
              🗑️ Delete
            </button>
          `;
          recipientsList.appendChild(recipientDiv);
          console.log(`📞 Added recipient ${index + 1}: ${phoneNumber}`);
        });

        // Add delete button event listeners
        document.querySelectorAll(".delete-recipient-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const phoneNumber = e.target.getAttribute("data-phone");
            if (confirm(`Delete ${phoneNumber} from SMS recipients?`)) {
              const result = await this.deleteRecipient(phoneNumber);
              alert(result.message);
            }
          });
        });
        console.log("✅ Delete button event listeners added");
      }
    } else {
      console.error("❌ Recipients list element not found!");
    }

    if (recipientCount) {
      recipientCount.textContent = this.state.recipients.length;
      console.log(
        `📊 Updated recipient count to: ${this.state.recipients.length}`
      );
    } else {
      console.error("❌ Recipient count element not found!");
    }

    console.log("✅ Recipients display updated");
  }

  setupRecipientsManagement() {
    console.log("🔧 Setting up recipients management...");

    // Add recipient button
    const addRecipientBtn = document.getElementById("add-recipient-btn");
    const phoneNumberInput = document.getElementById("phone-number-input");

    console.log("🔍 Found elements:", {
      addRecipientBtn: !!addRecipientBtn,
      phoneNumberInput: !!phoneNumberInput,
    });

    if (addRecipientBtn && phoneNumberInput) {
      addRecipientBtn.addEventListener("click", async () => {
        console.log("🖱️ Add recipient button clicked");
        const phoneNumber = phoneNumberInput.value.trim();
        console.log("📞 Phone number entered:", phoneNumber);

        if (!phoneNumber) {
          alert("Please enter a phone number");
          return;
        }

        if (!this.validatePhoneNumber(phoneNumber)) {
          alert(
            "Invalid phone number format. Use international format like +639171234567"
          );
          return;
        }

        console.log("✅ Phone number validated, adding...");
        const result = await this.addRecipient(phoneNumber);
        alert(result.message);

        if (result.success) {
          phoneNumberInput.value = "";
          console.log("🧹 Input field cleared");
        }
      });

      // Allow Enter key to add recipient
      phoneNumberInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          console.log("⌨️ Enter key pressed, triggering add button");
          addRecipientBtn.click();
        }
      });

      console.log("✅ Event listeners attached successfully");
    } else {
      console.error("❌ Failed to find add recipient elements!");
      if (!addRecipientBtn) console.error("❌ add-recipient-btn not found");
      if (!phoneNumberInput) console.error("❌ phone-number-input not found");
    }

    console.log("📱 Recipients management setup complete");
  }

  setupDOM() {
    const elementIds = [
      "auth-modal",
      "auth-login",
      "auth-cancel",
      "auth-institution",
      "auth-operator",
      "auth-password",
      "operator-name",
      "operator-institution",
      "logout-btn",
    ];

    elementIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id] = element;
        console.log(`✅ Found element: ${id}`);
      } else {
        console.warn(`⚠️ Element not found: ${id}`);
      }
    });

    console.log("🎯 DOM elements mapped");
  }

  safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  setupEventHandlers() {
    // Auth login button
    if (this.elements["auth-login"]) {
      this.elements["auth-login"].addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Auth cancel button
    if (this.elements["auth-cancel"]) {
      this.elements["auth-cancel"].addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/";
      });
    }

    // Logout button
    if (this.elements["logout-btn"]) {
      this.elements["logout-btn"].addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Emergency alert buttons
    this.setupEmergencyButtons();

    console.log("🎯 Event handlers configured");
  }

  setupEmergencyButtons() {
    // Get all quick alert buttons
    const alertButtons = document.querySelectorAll(".quick-alert-btn");
    console.log(`🔧 Setting up ${alertButtons.length} emergency alert buttons`);

    // Store button references for cooldown system IMMEDIATELY
    this.alertButtonElements = {
      "flash-flood": document.querySelector(
        '[data-alert="flash-flood"] .quick-alert-btn'
      ),
      "flood-watch": document.querySelector(
        '[data-alert="flood-watch"] .quick-alert-btn'
      ),
      "weather-update": document.querySelector(
        '[data-alert="weather-update"] .quick-alert-btn'
      ),
      "all-clear": document.querySelector(
        '[data-alert="all-clear"] .quick-alert-btn'
      ),
    };
    console.log(
      "✅ Alert button references stored:",
      Object.keys(this.alertButtonElements)
    );

    alertButtons.forEach((button, index) => {
      console.log(`🎯 Setting up button ${index + 1}:`, {
        classes: button.className,
        text: button.textContent.trim(),
      });

      button.addEventListener("click", (e) => {
        e.preventDefault();
        console.log(`🖱️ Emergency button clicked:`, {
          buttonIndex: index + 1,
          classes: button.className,
          operatorLoggedIn: this.state.operatorLoggedIn,
        });

        // CHECK COOLDOWN FIRST
        if (isGlobalCooldownActive()) {
          console.log("⏳ Alert system on cooldown, ignoring click");
          return;
        }

        if (!this.state.operatorLoggedIn) {
          alert("Please log in first to send emergency alerts");
          console.log("❌ User not logged in - cannot send alerts");
          return;
        }

        // START COOLDOWN IMMEDIATELY (before modal opens)
        startGlobalCooldown(this);

        // Determine alert type from button class
        let alertType = "info"; // default
        if (button.classList.contains("critical")) {
          alertType = "critical";
        } else if (button.classList.contains("warning")) {
          alertType = "warning";
        } else if (button.classList.contains("all-clear")) {
          alertType = "all-clear";
        }

        console.log(`📱 Alert type determined: ${alertType}`);

        // Send SMS command
        this.sendSMSAlert(alertType, button);
      });
    });

    console.log("✅ All emergency alert buttons configured");

    // Check for existing cooldown on page load (restore if active)
    checkAndRestoreCooldown(this);
  }

  async sendSMSAlert(alertType, button) {
    try {
      console.log(`📱 Sending ${alertType} SMS alert...`);
      console.log("📊 Current system state:", {
        operator: this.state.currentOperator,
        recipientCount: this.state.recipientCount,
        recipients: this.state.recipients,
        sensorData: this.state.sensorData,
      });

      // Check if we have recipients
      if (this.state.recipientCount === 0) {
        alert(
          "⚠️ No SMS recipients configured! Please add phone numbers first."
        );
        console.log("❌ No recipients configured for SMS alerts");
        return;
      }

      // Show loading
      const originalText = button.innerHTML;
      button.innerHTML = "<span>📤 Sending...</span>";
      button.disabled = true;

      // Prepare SMS data
      const smsData = {
        alertType: alertType,
        operator: this.state.currentOperator,
        timestamp: new Date().toISOString(),
        sensorData: this.state.sensorData,
        recipients: this.state.recipients,
        recipientCount: this.state.recipientCount,
      };

      console.log("📤 Sending SMS data to server:", smsData);

      // Send to server
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smsData),
      });

      console.log(
        "📡 Server response status:",
        response.status,
        response.statusText
      );

      const result = await response.json();
      console.log("📄 Server response data:", result);

      if (result.success) {
        console.log("✅ SMS command sent successfully to server");
        button.innerHTML = "<span>✅ Sent!</span>";

        // Show success message
        alert(`✅ SMS Alert Queued Successfully!

📱 Alert Type: ${alertType.toUpperCase()}
👤 Operator: ${this.state.currentOperator}
📞 Recipients: ${this.state.recipientCount} phone numbers
📊 Water Level: ${this.state.sensorData.waterLevel.toFixed(1)} inches
🌊 Flow Rate: ${this.state.sensorData.flowRate.toFixed(2)} m/s

⏳ The alert has been queued for Arduino to send via GSM.
The system will broadcast SMS to all recipients shortly.`);

        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 3000);
      } else {
        throw new Error(result.message || "Failed to send SMS");
      }
    } catch (error) {
      console.error("❌ Error sending SMS:", error);
      alert("Failed to send SMS alert: " + error.message);

      // Reset button
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  showAuthModal() {
    console.log("🔐 Showing authentication modal");
    const modal = this.elements["auth-modal"];
    if (modal) {
      modal.style.display = "flex";
      modal.classList.remove("hidden"); // Remove hidden class
      console.log("✅ Auth modal shown and hidden class removed");
    }

    // Hide dashboard
    const mainContent = document.querySelector(".emergency-dashboard");
    if (mainContent) {
      mainContent.style.display = "none";
    }
  }

  hideAuthModal() {
    console.log("🔓 Hiding authentication modal");
    const modal = this.elements["auth-modal"];

    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
      console.log("✅ Auth modal hidden");
    } else {
      console.error("❌ Auth modal not found!");
    }

    // Show dashboard
    const mainContent = document.querySelector(".emergency-dashboard");
    if (mainContent) {
      mainContent.style.display = "block";
      console.log("✅ Dashboard shown");
    } else {
      console.error("❌ Emergency dashboard not found!");
    }

    // Initialize WebSocket after successful login
    this.initializeWebSocket();

    // Load recipients and setup management interface
    this.loadRecipients();
    this.setupRecipientsManagement();
  }

  handleLogin() {
    console.log("🔐 Login attempt started");
    const institution = this.elements["auth-institution"]?.value;
    const operatorId = this.elements["auth-operator"]?.value;
    const password = this.elements["auth-password"]?.value;

    console.log("📋 Login data:", {
      institution: institution,
      operatorId: operatorId,
      passwordEntered: !!password,
      expectedPassword: this.config.ACCESS_CODES[institution],
    });

    if (!institution || !operatorId || !password) {
      alert("Please fill in all fields.");
      console.log("❌ Missing required fields");
      return;
    }

    if (this.config.ACCESS_CODES[institution] === password) {
      console.log("✅ Password validation successful");

      this.state.operatorLoggedIn = true;
      this.state.currentOperator = operatorId;
      this.state.operatorRole = this.getOperatorRole(institution);

      console.log("🎯 State updated:", {
        operatorLoggedIn: this.state.operatorLoggedIn,
        currentOperator: this.state.currentOperator,
        operatorRole: this.state.operatorRole,
      });

      console.log(
        `✅ Login successful: ${operatorId} (${this.state.operatorRole})`
      );

      this.updateOperatorInfo();

      console.log("🔄 About to hide auth modal...");
      this.hideAuthModal();
      console.log("✅ Auth modal hide completed");

      alert(`Welcome ${operatorId}! Emergency system access granted.`);
    } else {
      alert("Access denied. Invalid credentials.");
      console.log("❌ Login failed: Invalid credentials");
    }
  }

  handleLogout() {
    const operatorName = this.state.currentOperator;

    this.state.operatorLoggedIn = false;
    this.state.currentOperator = null;
    this.state.operatorRole = null;

    // Close WebSocket connection (prevent auto-reconnect)
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Reset reconnection tracking
    this.reconnectionAttempts = 0;
    this.isReconnecting = false;

    // Clear form fields
    if (this.elements["auth-institution"])
      this.elements["auth-institution"].value = "";
    if (this.elements["auth-operator"])
      this.elements["auth-operator"].value = "";
    if (this.elements["auth-password"])
      this.elements["auth-password"].value = "";

    this.showAuthModal();
    console.log(`👋 Operator ${operatorName} logged out`);
  }

  updateOperatorInfo() {
    if (this.elements["operator-name"]) {
      this.safeSetText(
        "operator-name",
        this.state.currentOperator || "Unknown"
      );
    }

    if (this.elements["operator-institution"]) {
      this.safeSetText(
        "operator-institution",
        this.state.operatorRole || "Unknown Role"
      );
    }
  }

  getOperatorRole(institution) {
    const roleMapping = {
      "agos-admin": "AGOS System Administrator",
    };
    return roleMapping[institution] || "Operator";
  }
}

// ========================================
// Arduino Monitor Functions
// ========================================

let arduinoAutoScroll = true;
let arduinoStartTime = Date.now();
let arduinoLineCount = 0;
let arduinoDataReceived = 0;
let arduinoSocket = null;

// ========================================
// Message Customization System
// ========================================

// Default messages for each alert type
const defaultMessages = {
  "flash-flood":
    "[🚨 FLASH FLOOD ALERT] Immediate evacuation required! Water levels rising rapidly. Move to higher ground NOW. This is a critical emergency. Stay safe and alert authorities.",
  "flood-watch":
    "[⚠️ FLOOD WATCH] Flooding is possible in your area. Monitor weather conditions closely. Prepare emergency supplies and evacuation routes. Stay tuned for updates.",
  "weather-update":
    "[🌧️ WEATHER UPDATE] Heavy rainfall expected in the coming hours. Exercise caution in low-lying areas. Stay informed through official weather advisories.",
  "all-clear":
    "[✅ ALL CLEAR] Flood threat has passed. Normal activities may resume. Stay cautious of residual water and damaged infrastructure. Thank you for your cooperation.",
};

// Store custom messages (null = use default)
let customMessages = {
  "flash-flood": null,
  "flood-watch": null,
  "weather-update": null,
  "all-clear": null,
};

// Currently editing alert type
let currentEditingAlertType = null;

// Initialize Arduino WebSocket connection
function initializeArduinoMonitor() {
  console.log("📡 Initializing Arduino monitor WebSocket...");

  const wsUrl = `ws://${window.location.host}`;
  arduinoSocket = new WebSocket(wsUrl);

  arduinoSocket.onopen = () => {
    console.log("✅ Arduino monitor WebSocket connected");
    updateArduinoStatus("connected", "Connected");
    addArduinoLog("✅ Connected to AGOS server", "success");
  };

  arduinoSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle sensor data from Arduino
      if (data.type === "sensor-data" || data.type === "sensor_data") {
        const sensorData = data.data || data;

        // Format sensor data as log message
        const message = `📊 Water: ${sensorData.waterLevel || 0} | Flow: ${
          sensorData.flowRate || 0
        } | Battery: ${sensorData.batteryLevel || 0}%`;
        addArduinoLog(message, "info");

        // Update data received counter
        arduinoDataReceived += event.data.length;
        updateArduinoStats();
      }
    } catch (error) {
      // If not JSON, treat as plain text message
      addArduinoLog(event.data, "info");
      arduinoDataReceived += event.data.length;
      updateArduinoStats();
    }
  };

  arduinoSocket.onclose = () => {
    console.log("❌ Arduino monitor WebSocket disconnected");
    updateArduinoStatus("disconnected", "Disconnected");
    addArduinoLog(
      "⚠️ Disconnected from server. Attempting to reconnect...",
      "warning"
    );

    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      if (
        document.querySelector(".emergency-dashboard").style.display !== "none"
      ) {
        initializeArduinoMonitor();
      }
    }, 3000);
  };

  arduinoSocket.onerror = (error) => {
    console.error("❌ Arduino monitor WebSocket error:", error);
    updateArduinoStatus("error", "Connection Error");
    addArduinoLog("❌ Connection error occurred", "error");
  };

  // Start uptime counter
  startArduinoUptime();
}

function updateArduinoStatus(status, text) {
  const statusBadge = document.getElementById("arduino-status-badge");
  const statusText = document.getElementById("arduino-status-text");

  if (statusBadge) {
    statusBadge.className = "status-badge status-" + status;
  }

  if (statusText) {
    statusText.textContent = text;
  }
}

function addArduinoLog(message, type = "info") {
  const output = document.getElementById("arduino-output");
  if (!output) return;

  const timestamp = new Date().toISOString().split("T")[1].replace("Z", "");
  const logLine = document.createElement("div");
  logLine.className = "log-line";

  logLine.innerHTML = `
    <span class="timestamp">[${timestamp}]</span>
    <span class="message ${type}">${escapeHtml(message)}</span>
  `;

  output.appendChild(logLine);
  arduinoLineCount++;

  // Auto-scroll if enabled
  if (arduinoAutoScroll) {
    output.scrollTop = output.scrollHeight;
  }

  updateArduinoStats();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function clearArduinoOutput() {
  console.log("🗑️ Clear button clicked");
  const output = document.getElementById("arduino-output");
  if (!output) {
    console.error("❌ arduino-output element not found");
    return;
  }

  output.innerHTML = "";
  arduinoLineCount = 0;

  addArduinoLog("🗑️ Output cleared", "info");
  console.log("✅ Arduino output cleared successfully");
}

function toggleArduinoAutoscroll() {
  console.log("📜 Toggle autoscroll clicked");
  arduinoAutoScroll = !arduinoAutoScroll;
  const btn = document.getElementById("arduino-autoscroll-btn");

  if (btn) {
    if (arduinoAutoScroll) {
      btn.classList.add("active");
      addArduinoLog("⬇️ Auto-scroll enabled", "success");
      console.log("✅ Auto-scroll enabled");
    } else {
      btn.classList.remove("active");
      addArduinoLog("⏸️ Auto-scroll disabled", "warning");
      console.log("⏸️ Auto-scroll disabled");
    }
  } else {
    console.error("❌ arduino-autoscroll-btn element not found");
  }

  console.log("📜 Auto-scroll is now:", arduinoAutoScroll ? "ON" : "OFF");
}

function exportArduinoLogs() {
  // This function is commented out as requested
  /*
  const output = document.getElementById("arduino-output");
  if (!output) return;

  const logs = Array.from(output.querySelectorAll(".log-line"))
    .map(line => line.textContent.trim())
    .join("\n");

  const blob = new Blob([logs], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arduino-logs-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  addArduinoLog("💾 Logs exported successfully", "success");
  console.log("💾 Arduino logs exported");
  */

  addArduinoLog("💾 Export feature is currently disabled", "warning");
  console.log("⚠️ Export function is commented out");
}

function sendArduinoCommand() {
  console.log("📤 Send command button clicked");
  const input = document.getElementById("arduino-input");
  if (!input) {
    console.error("❌ arduino-input element not found");
    return;
  }

  if (!input.value.trim()) {
    console.log("⚠️ No command entered");
    return;
  }

  const command = input.value.trim();
  console.log("📝 Command to send:", command);

  // Add command to output
  addArduinoLog(`📤 Command: ${command}`, "info");

  // Send command via WebSocket if connected
  if (arduinoSocket && arduinoSocket.readyState === WebSocket.OPEN) {
    arduinoSocket.send(
      JSON.stringify({
        type: "arduino-command",
        command: command,
      })
    );

    addArduinoLog("✅ Command sent to Arduino", "success");
    console.log("✅ Sent command to Arduino:", command);
  } else {
    addArduinoLog("❌ Not connected to server", "error");
    console.error("❌ Cannot send command - WebSocket not connected");
    console.log(
      "WebSocket state:",
      arduinoSocket ? arduinoSocket.readyState : "null"
    );
  }

  // Clear input
  input.value = "";
}

function handleArduinoKeyPress(event) {
  if (event.key === "Enter") {
    sendArduinoCommand();
  }
}

function updateArduinoStats() {
  // Update line count
  const lineCountEl = document.getElementById("arduino-line-count");
  if (lineCountEl) {
    lineCountEl.textContent = arduinoLineCount;
  }

  // Update data received
  const dataReceivedEl = document.getElementById("arduino-data-received");
  if (dataReceivedEl) {
    const kb = (arduinoDataReceived / 1024).toFixed(2);
    dataReceivedEl.textContent = `${kb} KB`;
  }
}

function startArduinoUptime() {
  setInterval(() => {
    const uptimeEl = document.getElementById("arduino-uptime");
    if (!uptimeEl) return;

    const elapsed = Date.now() - arduinoStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const formatted = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    uptimeEl.textContent = formatted;
  }, 1000);
}

// ========================================
// Message Customization Functions
// ========================================

// Open message customization modal
function openMessageCustomization(alertType) {
  console.log(`✏️ Opening customization for: ${alertType}`);
  currentEditingAlertType = alertType;

  const modal = document.getElementById("message-customization-modal");
  const modalTitle = document.getElementById("customize-modal-title");
  const defaultMsgDisplay = document.getElementById("default-message-display");
  const customMsgInput = document.getElementById("custom-message-input");

  // Set modal title based on alert type
  const titles = {
    "flash-flood": "✏️ Customize Flash Flood Alert",
    "flood-watch": "✏️ Customize Flood Watch Alert",
    "weather-update": "✏️ Customize Weather Update",
    "all-clear": "✏️ Customize All Clear Message",
  };
  modalTitle.textContent = titles[alertType] || "✏️ Customize Alert Message";

  // Display default message
  defaultMsgDisplay.value = defaultMessages[alertType];

  // Display current custom message (if any)
  customMsgInput.value = customMessages[alertType] || "";

  // Update character count
  updateCharacterCount();

  // Show modal (ensure display set so modal is visible)
  modal.classList.remove("hidden");
  try {
    // Some modals (like auth-modal) rely on a display:flex override; ensure this modal is visible
    modal.style.display = "flex";
  } catch (e) {
    console.warn("⚠️ Could not set modal.style.display:", e);
  }

  // Focus the input for quick editing
  if (customMsgInput) {
    setTimeout(() => customMsgInput.focus(), 50);
  }
}

// Close message customization modal
function closeMessageCustomization() {
  console.log("❌ Closing customization modal");
  const modal = document.getElementById("message-customization-modal");
  const customMsgInput = document.getElementById("custom-message-input");

  // Hide modal and clear input
  if (modal) {
    modal.classList.add("hidden");
    try {
      modal.style.display = "none";
    } catch (e) {
      console.warn("⚠️ Could not set modal.style.display:", e);
    }
  }

  if (customMsgInput) customMsgInput.value = "";
  currentEditingAlertType = null;
}

// Save custom message
function saveCustomMessage() {
  if (!currentEditingAlertType) {
    console.error("❌ No alert type selected");
    return;
  }

  const customMsgInput = document.getElementById("custom-message-input");
  const customMsg = customMsgInput.value.trim();

  // Save custom message (or null if blank)
  customMessages[currentEditingAlertType] = customMsg || null;

  console.log(
    `💾 Saved custom message for ${currentEditingAlertType}:`,
    customMsg || "Using default"
  );

  // Optional: Save to localStorage for persistence
  try {
    localStorage.setItem(
      "agos-custom-messages",
      JSON.stringify(customMessages)
    );
    console.log("✅ Custom messages saved to localStorage");
  } catch (error) {
    console.error("⚠️ Could not save to localStorage:", error);
  }

  closeMessageCustomization();
}

// Reset to default message
function resetToDefaultMessage() {
  if (!currentEditingAlertType) {
    console.error("❌ No alert type selected");
    return;
  }

  const customMsgInput = document.getElementById("custom-message-input");
  customMsgInput.value = "";
  customMessages[currentEditingAlertType] = null;

  console.log(`🔄 Reset ${currentEditingAlertType} to default message`);

  // Update localStorage
  try {
    localStorage.setItem(
      "agos-custom-messages",
      JSON.stringify(customMessages)
    );
  } catch (error) {
    console.error("⚠️ Could not save to localStorage:", error);
  }

  updateCharacterCount();
}

// Update character count
function updateCharacterCount() {
  const customMsgInput = document.getElementById("custom-message-input");
  const charCounter = document.getElementById("char-counter");

  if (!customMsgInput || !charCounter) return;

  const length = customMsgInput.value.length;
  charCounter.textContent = `${length}/160`;

  // Color coding
  charCounter.classList.remove("warning", "danger");
  if (length > 150) {
    charCounter.classList.add("danger");
  } else if (length > 130) {
    charCounter.classList.add("warning");
  }
}

// Get final message (custom or default)
function getFinalMessage(alertType) {
  return customMessages[alertType] || defaultMessages[alertType];
}

// Load custom messages from localStorage on init
function loadCustomMessages() {
  try {
    const saved = localStorage.getItem("agos-custom-messages");
    if (saved) {
      customMessages = JSON.parse(saved);
      console.log("✅ Loaded custom messages from localStorage");
    }
  } catch (error) {
    console.error("⚠️ Could not load custom messages:", error);
  }
}

// ==================== GLOBAL ALERT COOLDOWN SYSTEM ====================

// Start global 3-minute cooldown for ALL alert buttons
function startGlobalCooldown(agosSystem) {
  const COOLDOWN_DURATION = 180000; // 3 minutes in milliseconds
  const endTime = Date.now() + COOLDOWN_DURATION;

  console.log("⏳ Starting global alert cooldown (3 minutes)");
  console.log(
    "📋 Button elements available:",
    Object.keys(agosSystem.alertButtonElements)
  );
  console.log("📋 Button elements check:", agosSystem.alertButtonElements);

  // Save to localStorage for persistence
  localStorage.setItem("agos-alert-cooldown-end-time", endTime.toString());

  // Update system state
  agosSystem.globalAlertCooldown.active = true;
  agosSystem.globalAlertCooldown.endTime = endTime;

  // Disable all 4 buttons
  Object.entries(agosSystem.alertButtonElements).forEach(([type, btn]) => {
    if (btn) {
      console.log(`🔒 Disabling button: ${type}`, btn);
      btn.classList.add("cooldown");
      btn.disabled = true;
    } else {
      console.warn(`⚠️ Button not found: ${type}`);
    }
  });

  // Start countdown display
  agosSystem.globalAlertCooldown.intervalId = setInterval(() => {
    updateGlobalCooldownDisplay(agosSystem);
  }, 1000);

  // Initial display update
  updateGlobalCooldownDisplay(agosSystem);
  console.log("✅ Cooldown started successfully");
}

// Update countdown display on all buttons
function updateGlobalCooldownDisplay(agosSystem) {
  const now = Date.now();
  const remaining = agosSystem.globalAlertCooldown.endTime - now;

  if (remaining <= 0) {
    // Cooldown expired
    endGlobalCooldown(agosSystem);
    return;
  }

  // Calculate MM:SS format
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  console.log(`⏱️ Updating cooldown display: ${formattedTime}`);

  // Update all button texts
  Object.entries(agosSystem.alertButtonElements).forEach(([alertType, btn]) => {
    if (btn) {
      btn.innerHTML = `⏳ Wait ${formattedTime}`;
    }
  });
}

// End cooldown and restore buttons
function endGlobalCooldown(agosSystem) {
  console.log("✅ Global alert cooldown ended");

  // Clear interval
  if (agosSystem.globalAlertCooldown.intervalId) {
    clearInterval(agosSystem.globalAlertCooldown.intervalId);
    agosSystem.globalAlertCooldown.intervalId = null;
  }

  // Clear localStorage
  localStorage.removeItem("agos-alert-cooldown-end-time");

  // Reset state
  agosSystem.globalAlertCooldown.active = false;
  agosSystem.globalAlertCooldown.endTime = null;

  // Re-enable all buttons and restore original text
  Object.entries(agosSystem.alertButtonElements).forEach(([alertType, btn]) => {
    if (btn) {
      btn.classList.remove("cooldown");
      btn.disabled = false;
      btn.innerHTML = agosSystem.originalButtonTexts[alertType];
    }
  });
}

// Check if cooldown is currently active
function isGlobalCooldownActive() {
  const endTimeStr = localStorage.getItem("agos-alert-cooldown-end-time");
  if (!endTimeStr) return false;

  const endTime = parseInt(endTimeStr, 10);
  return endTime > Date.now();
}

// Check and restore cooldown on page load
function checkAndRestoreCooldown(agosSystem) {
  const endTimeStr = localStorage.getItem("agos-alert-cooldown-end-time");
  if (!endTimeStr) return;

  const endTime = parseInt(endTimeStr, 10);
  const now = Date.now();

  if (endTime > now) {
    console.log("🔄 Restoring alert cooldown from previous session");

    // Restore state
    agosSystem.globalAlertCooldown.active = true;
    agosSystem.globalAlertCooldown.endTime = endTime;

    // Disable buttons
    Object.values(agosSystem.alertButtonElements).forEach((btn) => {
      if (btn) {
        btn.classList.add("cooldown");
        btn.disabled = true;
      }
    });

    // Start countdown from remaining time
    agosSystem.globalAlertCooldown.intervalId = setInterval(() => {
      updateGlobalCooldownDisplay(agosSystem);
    }, 1000);

    // Initial display
    updateGlobalCooldownDisplay(agosSystem);
  } else {
    // Cooldown expired while page was closed
    console.log("✅ Previous cooldown expired, cleaning up");
    localStorage.removeItem("agos-alert-cooldown-end-time");
  }
}

// ==================== END COOLDOWN SYSTEM ====================

// Make functions globally accessible for onclick handlers
window.clearArduinoOutput = clearArduinoOutput;
window.toggleArduinoAutoscroll = toggleArduinoAutoscroll;
window.sendArduinoCommand = sendArduinoCommand;
window.handleArduinoKeyPress = handleArduinoKeyPress;
window.exportArduinoLogs = exportArduinoLogs;

// Debug: Verify functions are globally accessible
console.log("🔧 Arduino Monitor Functions Registered:");
console.log("  clearArduinoOutput:", typeof window.clearArduinoOutput);
console.log(
  "  toggleArduinoAutoscroll:",
  typeof window.toggleArduinoAutoscroll
);
console.log("  sendArduinoCommand:", typeof window.sendArduinoCommand);
console.log("  handleArduinoKeyPress:", typeof window.handleArduinoKeyPress);

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌊 Initializing AGOS Emergency System...");
  window.agosEmergencySystem = new AGOSEmergencySystem();

  // Initialize Arduino monitor after a short delay to ensure dashboard is loaded
  setTimeout(() => {
    console.log("📡 Starting Arduino monitor initialization...");
    initializeArduinoMonitor();

    // Add event listeners for Arduino monitor buttons (CSP-compliant)
    const clearBtn = document.getElementById("arduino-clear-btn");
    const autoscrollBtn = document.getElementById("arduino-autoscroll-btn");
    const sendBtn = document.getElementById("arduino-send-btn");
    const inputField = document.getElementById("arduino-input");

    if (clearBtn) {
      clearBtn.addEventListener("click", clearArduinoOutput);
      console.log("✅ Clear button event listener attached");
    }

    if (autoscrollBtn) {
      autoscrollBtn.addEventListener("click", toggleArduinoAutoscroll);
      console.log("✅ Auto-scroll button event listener attached");
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", sendArduinoCommand);
      console.log("✅ Send button event listener attached");
    }

    if (inputField) {
      inputField.addEventListener("keypress", handleArduinoKeyPress);
      console.log("✅ Input field keypress listener attached");
    }

    // Load saved custom messages
    loadCustomMessages();

    // Add event listeners for message customization buttons
    const customizeButtons = [
      {
        id: "customize-flash-flood-btn",
        type: "flash-flood",
      },
      {
        id: "customize-flood-watch-btn",
        type: "flood-watch",
      },
      {
        id: "customize-weather-update-btn",
        type: "weather-update",
      },
      {
        id: "customize-all-clear-btn",
        type: "all-clear",
      },
    ];

    customizeButtons.forEach((btn) => {
      const element = document.getElementById(btn.id);
      if (element) {
        element.addEventListener("click", () =>
          openMessageCustomization(btn.type)
        );
        console.log(`✅ Customize button attached: ${btn.type}`);
      }
    });

    // Modal control buttons
    const closeModalBtn = document.getElementById("close-customize-modal");
    const cancelBtn = document.getElementById("cancel-customize-btn");
    const saveBtn = document.getElementById("save-custom-message-btn");
    const resetBtn = document.getElementById("reset-message-btn");
    const customMsgInput = document.getElementById("custom-message-input");

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeMessageCustomization);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeMessageCustomization);
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", saveCustomMessage);
      console.log("✅ Save custom message button attached");
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", resetToDefaultMessage);
      console.log("✅ Reset button attached");
    }

    if (customMsgInput) {
      customMsgInput.addEventListener("input", updateCharacterCount);
      console.log("✅ Character counter attached");
    }

    // Button references are now stored in setupEmergencyButtons()
    // Cooldown restoration also happens there
  }, 1000);
});

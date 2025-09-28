/**
 * AGOS Module 4: Emergency Response Control Panel
 * Fixed version focusing on authentication and basic functionality
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
    };

    this.elements = {};
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

  /**
   * Safe DOM helper - set textContent of an element only if it exists.
   * Use this helper when updating UI text to avoid runtime errors if an
   * element is missing (e.g., during iterative edits to HTML/CSS).
   */
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

    console.log("🎮 Event handlers configured");
  }

  showAuthModal() {
    const authModal = this.elements["auth-modal"];
    if (authModal) {
      authModal.style.display = "flex";
      authModal.classList.remove("hidden");
    }

    const mainContent = document.querySelector(".emergency-dashboard");
    if (mainContent) {
      mainContent.style.display = "none";
    }

    console.log("🔐 Auth modal shown");
  }

  hideAuthModal() {
    const authModal = this.elements["auth-modal"];
    if (authModal) {
      authModal.style.display = "none";
      authModal.classList.add("hidden");
    }

    const mainContent = document.querySelector(".emergency-dashboard");
    if (mainContent) {
      mainContent.style.display = "block";
    }

    console.log("🔓 Auth modal hidden");
  }

  handleLogin() {
    const institution = this.elements["auth-institution"]?.value;
    const operatorId = this.elements["auth-operator"]?.value;
    const password = this.elements["auth-password"]?.value;

    if (!institution || !operatorId || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (this.config.ACCESS_CODES[institution] === password) {
      this.state.operatorLoggedIn = true;
      this.state.currentOperator = operatorId;
      this.state.operatorRole = this.getOperatorRole(institution);

      console.log(
        `✅ Login successful: ${operatorId} (${this.state.operatorRole})`
      );

      this.updateOperatorInfo();
      this.hideAuthModal();

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
    const operatorName = this.elements["operator-name"];
    const operatorInstitution = this.elements["operator-institution"];

    if (operatorName) {
      this.safeSetText(
        "operator-name",
        this.state.currentOperator || "Unknown"
      );
    }

    if (operatorInstitution) {
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

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌊 Initializing AGOS Emergency System...");
  window.agosEmergencySystem = new AGOSEmergencySystem();
});

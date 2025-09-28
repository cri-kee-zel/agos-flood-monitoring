/**
 * AGOS Main Gateway Controller
 * Central navigation and system overview
 *
 * Author: cri-kee-zel
 * Date: 2025-08-18 13:06:47 UTC
 */

/**
 * AGOSMainGateway
 * Encapsulates the UI logic for the AGOS main gateway page.
 * Responsibilities:
 * - Maintain local UI state snapshot (this.state)
 * - Poll server endpoints for system overview data
 * - Update DOM elements (safely) with latest values
 * - Handle navigation to module pages and provide UX overlays
 * - Wire up animations and button handlers for the module cards
 *
 * Notes about data shape expected from the server (GET /api/system-overview):
 * {
 *   sensors: { online: Number, total: Number },
 *   currentData: { waterLevel: Number, flowRate: Number, alertStatus: String, batteryLevel: Number },
 *   systemStats: { aiAccuracy: Number, uptime: Number }
 * }
 *
 * The class is intentionally defensive about DOM access — use the
 * `safeSetText` helper when updating elements to avoid TypeErrors while
 * iterating on the UI.
 */

// Main class for controlling the AGOS gateway functionality
class AGOSMainGateway {
  /**
   * Create a new AGOSMainGateway instance.
   * The constructor sets an initial `state` object and calls `init()`.
   * Keep the `state` shape compatible with the server's `/api/system-overview`.
   */
  // Constructor - runs when new instance is created
  constructor() {
    // System state object to track current status and data
    this.state = {
      systemStatus: "online", // Overall system status
      sensors: {
        online: 3, // Number of sensors currently online
        total: 3, // Total number of sensors in system
      },
      currentData: {
        waterLevel: 47.8, // Current water level in cm
        flowRate: 1.24, // Current flow rate in m/s
        alertStatus: "NORMAL", // Current alert level
        batteryLevel: 85, // Battery percentage
      },
      systemStats: {
        aiAccuracy: 87.2, // AI model accuracy percentage
        uptime: 99.9, // System uptime percentage
      },
    };

    // Initialize the system when instance is created
    this.init();
  }

  /**
   * Initialize the main gateway
   * This method sets up all the initial functionality
   */
  init() {
    console.log("🌊 AGOS Main Gateway Initializing...");

    // Call individual initialization methods
    // Note: these methods use safe DOM helpers to avoid runtime errors
    // when elements are temporarily missing during development.
    this.updateTimestamp(); // Set initial timestamp
    this.updateSystemStats(); // Display system statistics
    this.updateStatusOverview(); // Show current sensor readings
    this.setupAnimations(); // Initialize card animations
    this.startRealTimeUpdates(); // Begin periodic updates

    console.log("✅ AGOS Main Gateway Ready");
  }

  /**
   * Safe DOM helper - set text content of an element only if it exists.
   * Use this whenever you write to an element that may be removed/renamed
   * during iterative UI changes to prevent uncaught TypeErrors.
   * @param {string} id - element id
   * @param {string} text - text to set
   */
  safeSetText(id, text) {
    try {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    } catch (e) {
      // Swallow errors to keep UI resilient during edits
      console.warn(`safeSetText failed for #${id}:`, e);
    }
  }

  /**
   * Fetch system data from API
   * Retrieves live data from the server
   * Expected response shape: object compatible with this.state (see class JSDoc)
   */
  async fetchSystemData() {
    try {
      const response = await fetch("/api/system-overview");
      const data = await response.json();

      // Update state with new data
      this.state = { ...this.state, ...data };

      console.log("📊 System data updated from API");
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch system data, using simulated data:",
        error
      );
    }
  }

  /**
   * Navigate to specific module
   * @param {string} moduleUrl - The URL/filename of the module to navigate to
   */
  navigateToModule(moduleUrl) {
    console.log(`🚀 Navigating to: ${moduleUrl}`);
    console.log("🔧 Creating loading overlay...");

    // Create and show loading overlay for better user experience
    const loadingOverlay = this.createLoadingOverlay();
    document.body.appendChild(loadingOverlay);

    console.log("🔧 Loading overlay added, waiting 800ms...");

    // Wait 800ms before navigation to show loading animation
    setTimeout(() => {
      console.log(`🔧 Navigating now to: ${moduleUrl}`);
      window.location.href = moduleUrl; // Navigate to the requested module
    }, 800);
  }

  /**
   * Create loading overlay for navigation
   * @returns {HTMLElement} - The loading overlay element
   * Note: this function appends CSS for the spinner animation to the document head.
   * The caller is responsible for removing the overlay if navigation is cancelled.
   */
  createLoadingOverlay() {
    // Create new div element for the overlay
    const overlay = document.createElement("div");

    // Set the HTML content of the overlay with inline styles
    overlay.innerHTML = `
            <div style="
                position: fixed;                  /* Fixed position to cover entire screen */
                top: 0;                          /* Align to top */
                left: 0;                         /* Align to left */
                width: 100%;                     /* Full width */
                height: 100%;                    /* Full height */
                background: rgba(15, 23, 42, 0.9); /* Semi-transparent dark background */
                display: flex;                   /* Flexbox for centering */
                align-items: center;             /* Center vertically */
                justify-content: center;         /* Center horizontally */
                z-index: 9999;                   /* High z-index to appear above everything */
                backdrop-filter: blur(10px);     /* Blur effect behind overlay */
            ">
                <div style="
                    text-align: center;          /* Center the content */
                    color: white;                /* White text */
                ">
                    <div style="
                        font-size: 3rem;            /* Large emoji */
                        margin-bottom: 1rem;        /* Space below */
                        animation: spin 1s linear infinite; /* Spinning animation */
                    ">🌊</div>
                    <p style="font-size: 1.2rem; opacity: 0.9;">Loading module...</p>
                </div>
            </div>
        `;

    // Create CSS style element for the spin animation
    const style = document.createElement("style");
    style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }   /* Start at 0 degrees */
                to { transform: rotate(360deg); }   /* End at 360 degrees */
            }
        `;
    document.head.appendChild(style); // Add styles to document head

    return overlay; // Return the created overlay element
  }

  /**
   * Update timestamp display
   * Updates the current time shown in the header
   */
  updateTimestamp() {
    // Get current time and update the timestamp display (safe)
    const now = new Date(); // Get current date and time
    // Format as YYYY-MM-DD HH:MM:SS UTC
    const utcString = now.toISOString().slice(0, 19).replace("T", " ") + " UTC";
    this.safeSetText("current-time", utcString);
  }

  /**
   * Update system statistics
   * Updates the statistics shown in the welcome section
   */
  updateSystemStats() {
    // Update UI stats safely using helper to avoid errors when elements are
    // being renamed/edited during development.
    this.safeSetText("sensors-online", String(this.state.sensors.online));
    this.safeSetText("ai-accuracy", `${this.state.systemStats.aiAccuracy}%`);
    this.safeSetText("uptime", `${this.state.systemStats.uptime}%`);
  }

  /**
   * Update status overview panel
   * Updates the real-time status readings in the overview panel
   */
  updateStatusOverview() {
    // Update status overview items (safe)
    this.safeSetText(
      "current-water-level",
      `${this.state.currentData.waterLevel} cm`
    );
    this.safeSetText(
      "current-flow-rate",
      `${this.state.currentData.flowRate} m/s`
    );
    this.safeSetText("alert-status", this.state.currentData.alertStatus);
    // Format battery level to two decimal places, handling numbers or strings
    {
      const rawBattery = this.state.currentData.batteryLevel;
      let batteryText = String(rawBattery);
      const parsed = parseFloat(rawBattery);
      if (!Number.isNaN(parsed)) {
        batteryText = parsed.toFixed(2) + "%";
      }
      this.safeSetText("battery-level", batteryText);
    }
  }

  /**
   * Setup module card animations
   * Adds entrance animations and interactive effects to module cards
   */
  setupAnimations() {
    // Get all module cards on the page
    const moduleCards = document.querySelectorAll(".module-card");

    // Loop through each card to set up animations
    moduleCards.forEach((card, index) => {
      // Stagger animation timing based on card position
      card.style.animationDelay = `${index * 0.1}s`;
      card.style.animation = "fadeInUp 0.6s ease-out forwards";

      // Add hover effects
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px) scale(1.02)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0) scale(1)";
      });
    });

    // Setup direct button click handlers as backup. Using both
    // inline `onclick` and delegated handlers makes the UI robust to
    // different markup editing workflows.
    this.setupButtonHandlers();
  }

  /**
   * Setup direct button click handlers
   * Alternative to HTML onclick attributes
   */
  setupButtonHandlers() {
    console.log("🔧 Setting up button handlers...");

    // Get all module buttons
    const buttons = document.querySelectorAll(".module-btn");
    console.log(`🔧 Found ${buttons.length} module buttons`);

    // For each button we determine the intended module by checking two
    // places (in order): 1) the visible button text, 2) the parent card's
    // `data-module` attribute. This makes the handler tolerant of markup
    // rearrangements (e.g., designer renames text but keeps data attributes).
    buttons.forEach((button, index) => {
      console.log(`🔧 Setting up button ${index}:`, button.textContent.trim());

      // Add click event listener
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(`🔧 Button clicked:`, button.textContent.trim());

        // Determine the module URL based on button text or parent card
        let moduleUrl = "";
        const buttonText = button.textContent.toLowerCase();
        const card = button.closest(".module-card");
        const cardModule = card ? card.dataset.module : "";

        console.log(
          `🔧 Button text: ${buttonText}, Card module: ${cardModule}`
        );

        if (buttonText.includes("dashboard") || cardModule === "dashboard") {
          moduleUrl = "/dashboard";
        } else if (buttonText.includes("mapping") || cardModule === "mapping") {
          moduleUrl = "/mapping";
        } else if (
          buttonText.includes("analytics") ||
          cardModule === "analytics"
        ) {
          moduleUrl = "/analytics";
        } else if (
          buttonText.includes("emergency") ||
          cardModule === "emergency"
        ) {
          moduleUrl = "/emergency";
        }

        console.log(`🔧 Determined moduleUrl: ${moduleUrl}`);

        if (moduleUrl) {
          // Perform the UX-enhanced navigation so the spinner shows
          this.navigateToModule(moduleUrl);
        } else {
          // Log a clear error to help designers find missing dataset or
          // button label issues during iterative edits.
          console.error(
            "❌ Could not determine module URL for button:",
            button
          );
        }
      });
    });
  }

  /**
   * Start real-time updates
   * Begins periodic updates of system data
   */
  startRealTimeUpdates() {
    console.log("🔄 Starting real-time updates...");

    // Initial data fetch
    this.fetchSystemData();

    // Set up interval for periodic updates (every 5 seconds)
    setInterval(async () => {
      await this.fetchSystemData();
      this.updateTimestamp();
      this.updateSystemStats();
      this.updateStatusOverview();
    }, 5000);
  }
}

// Make navigateToModule available globally for onclick handlers
function navigateToModule(moduleUrl) {
  console.log(`🔧 Global navigateToModule called with: ${moduleUrl}`);

  if (window.agosMainGateway) {
    console.log("📱 Using AGOS gateway navigation");
    window.agosMainGateway.navigateToModule(moduleUrl);
  } else {
    console.log("📱 Using fallback direct navigation");
    // Fallback direct navigation
    window.location.href = moduleUrl;
  }
}

// Initialize the AGOS Main Gateway when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌊 AGOS Main Gateway Starting...");
  window.agosMainGateway = new AGOSMainGateway();
});

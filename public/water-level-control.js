(function () {
  let ws = null;
  let currentLevel = 0;
  const maxHeight = 19; // inches (maximum water level)

  // WebSocket connection (uses runtime BACKEND_URL when available)
  function connectWebSocket() {
    const runtimeBackend = (window.AGOS_BACKEND || "").replace(/\/$/, "");
    let backendHost =
      runtimeBackend || `${window.location.protocol}//${window.location.host}`;
    const wsProtocol = backendHost.startsWith("https") ? "wss:" : "ws:";
    const wsHost = new URL(backendHost).host;
    const wsUrl = `${wsProtocol}//${wsHost}`;

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      return;
    }

    ws.onopen = () => {
      console.log("✅ Connected to AGOS server");
      const cs = document.getElementById("connectionStatus");
      if (cs) {
        cs.textContent = "✅ Connected to Server";
        cs.className = "connection-status connected";
      }
    };

    ws.onclose = () => {
      console.log("❌ Disconnected from server");
      const cs = document.getElementById("connectionStatus");
      if (cs) {
        cs.textContent = "❌ Disconnected - Reconnecting...";
        cs.className = "connection-status disconnected";
      }
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "water-level") {
          updateWaterDisplay(data.level);
        }
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    };
  }

  function setWaterLevel(inches, buttonElement) {
    console.log(`🔵 Button clicked: ${inches} inches`);
    console.log(`🔵 Button element:`, buttonElement);

    currentLevel = inches;

    // Update visual display in this page
    updateWaterDisplay(inches);

    // Remove active class from all buttons
    document.querySelectorAll(".control-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Add active class to clicked button (stays clicked)
    if (buttonElement) {
      buttonElement.classList.add("active");
      console.log(`✅ Active class added to button`);
    }

    // Send water level to Module 1 via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: "water-level-control",
        level: inches,
        timestamp: new Date().toISOString(),
      };
      console.log(`📤 Sending WebSocket message:`, payload);

      try {
        ws.send(JSON.stringify(payload));
      } catch (e) {
        console.error("Failed to send WS message:", e);
      }

      const last = document.getElementById("lastCommand");
      if (last)
        last.textContent = `✅ Water level set to ${inches} inches - Sent to Module 1`;
      console.log(
        `💧 Water level changed to: ${inches} inches - Broadcasting to Module 1`,
      );
    } else {
      console.warn(
        `⚠️ WebSocket not ready. State: ${ws ? ws.readyState : "null"}`,
      );
      const last = document.getElementById("lastCommand");
      if (last)
        last.textContent = `⚠️ Water level set to ${inches} inches - Not connected to server`;
      console.warn("WebSocket not connected, cannot send to Module 1");
    }
  }

  function updateWaterDisplay(inches) {
    const percentage = (inches / maxHeight) * 100;
    const waterElement = document.getElementById("waterLevel");
    const textElement = document.getElementById("levelText");

    if (waterElement) waterElement.style.height = percentage + "%";
    if (textElement) textElement.textContent = inches + '"';

    // Change water color based on level
    const element = waterElement;
    if (!element) return;

    if (inches === 0) {
      element.style.background =
        "linear-gradient(to top, #90CAF9 0%, #BBDEFB 100%)";
    } else if (inches <= 2) {
      element.style.background =
        "linear-gradient(to top, #66BB6A 0%, #81C784 100%)";
    } else if (inches <= 10) {
      element.style.background =
        "linear-gradient(to top, #FFA726 0%, #FFB74D 100%)";
    } else if (inches <= 19) {
      element.style.background =
        "linear-gradient(to top, #EF5350 0%, #E57373 100%)";
    } else {
      element.style.background =
        "linear-gradient(to top, #B71C1C 0%, #C62828 100%)";
    }
  }

  // Initialize when DOM is ready
  function init() {
    // Add click event listeners to all buttons
    document.querySelectorAll(".control-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const level = parseInt(this.getAttribute("data-level"));
        setWaterLevel(level, this);
      });
    });

    // Handle page visibility to reconnect WebSocket
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
    });

    connectWebSocket();
    updateWaterDisplay(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

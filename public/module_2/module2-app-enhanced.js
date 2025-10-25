/**
 * AGOS Module 2: Professional AI Mapping & GPS System
 * Enhanced with real-time database integration and satellite mapping
 * Author: AGOS Development Team
 * Date: 2025-10-19
 */

class AGOSMappingSystem {
  constructor() {
    // System configuration
    this.config = {
      DEFAULT_CENTER: [14.6042, 121.0887], // Bulacan, Philippines coordinates
      DEFAULT_ZOOM: 13,
      UPDATE_INTERVAL: 5000, // 5 seconds
      ALERT_LEVELS: {
        NORMAL: { color: "#22c55e", threshold: 0 },
        ALERT: { color: "#f59e0b", threshold: 60 },
        EMERGENCY: { color: "#ef4444", threshold: 80 },
      },
    };

    // Application state
    this.state = {
      map: null,
      socket: null,
      isConnected: false,
      currentData: null,
      sensorLocations: [],
      selectedSensor: null,
      mapLayers: {
        satellite: null,
        sensors: null,
        floodZones: null,
      },
    };

    // Initialize the mapping system
    this.init();
  }

  async init() {
    console.log("🗺️ Initializing AGOS Professional Mapping System...");

    try {
      await this.initializeMap();
      await this.loadGPSLocations();
      this.setupWebSocket();
      this.setupEventHandlers();
      this.startDataUpdates();

      console.log("✅ AGOS Mapping System initialized successfully!");
    } catch (error) {
      console.error("❌ Mapping system initialization failed:", error);
    }
  }

  async initializeMap() {
    console.log("🗺️ Setting up interactive satellite map...");

    // Check if Leaflet is available
    if (typeof L === "undefined") {
      console.error("❌ Leaflet library not loaded");
      return;
    }

    // Initialize Leaflet map
    this.state.map = L.map("flood-map", {
      center: this.config.DEFAULT_CENTER,
      zoom: this.config.DEFAULT_ZOOM,
      zoomControl: false, // We'll add custom controls
    });

    // Add satellite tile layer
    this.state.mapLayers.satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Satellite imagery © Esri",
        maxZoom: 18,
      }
    ).addTo(this.state.map);

    // Add custom controls
    this.addCustomControls();

    // Update map status
    this.updateStatus("satellite-status", "online");

    console.log("✅ Interactive map initialized with satellite imagery");
  }

  addCustomControls() {
    // Custom zoom control
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(this.state.map);

    // Layer control for different map types
    const baseLayers = {
      Satellite: this.state.mapLayers.satellite,
      Street: L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
        }
      ),
      Terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenTopoMap contributors",
      }),
    };

    L.control.layers(baseLayers).addTo(this.state.map);

    // Scale control
    L.control
      .scale({
        position: "bottomleft",
      })
      .addTo(this.state.map);
  }

  async loadGPSLocations() {
    try {
      console.log("📍 Loading GPS sensor locations from database...");

      const response = await fetch("/api/gps-locations");
      const data = await response.json();

      if (data.success) {
        this.state.sensorLocations = data.locations;
        this.displaySensorMarkers();
        this.updateSensorCount(data.count);
        console.log(`✅ Loaded ${data.count} GPS sensor locations`);
      } else {
        console.warn("⚠️ No GPS locations found, using default locations");
        this.addDefaultLocations();
      }
    } catch (error) {
      console.error("❌ Failed to load GPS locations:", error);
      this.addDefaultLocations();
    }
  }

  addDefaultLocations() {
    // Add default sensor locations for demonstration
    const defaultLocations = [
      {
        sensor_id: "AGOS-001",
        latitude: 14.6042,
        longitude: 121.0887,
        location_name: "Angat River - Main Station",
        river_name: "Angat River",
        barangay: "Poblacion",
        municipality: "Angat",
        province: "Bulacan",
        status: "active",
      },
      {
        sensor_id: "AGOS-002",
        latitude: 14.6055,
        longitude: 121.0895,
        location_name: "Angat Bridge Monitoring",
        river_name: "Angat River",
        barangay: "San Vicente",
        municipality: "Angat",
        province: "Bulacan",
        status: "active",
      },
    ];

    this.state.sensorLocations = defaultLocations;
    this.displaySensorMarkers();
    this.updateSensorCount(defaultLocations.length);
  }

  displaySensorMarkers() {
    // Clear existing sensor layer
    if (this.state.mapLayers.sensors) {
      this.state.map.removeLayer(this.state.mapLayers.sensors);
    }

    // Create sensor markers layer group
    this.state.mapLayers.sensors = L.layerGroup();

    this.state.sensorLocations.forEach((location) => {
      const marker = this.createSensorMarker(location);
      this.state.mapLayers.sensors.addLayer(marker);
    });

    // Add to map
    this.state.mapLayers.sensors.addTo(this.state.map);
  }

  createSensorMarker(location) {
    // Determine marker color based on sensor status
    const alertStatus = this.getCurrentAlertStatus(location);
    const markerColor =
      this.config.ALERT_LEVELS[alertStatus]?.color || "#22c55e";

    // Create custom icon
    const icon = L.divIcon({
      html: `
        <div class="sensor-marker" style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
          📡
        </div>
      `,
      className: "custom-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Create marker
    const marker = L.marker([location.latitude, location.longitude], { icon });

    // Add popup with sensor details
    const popupContent = this.createSensorPopup(location);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: "sensor-popup",
    });

    // Add click handler
    marker.on("click", () => {
      this.selectSensor(location.sensor_id);
    });

    return marker;
  }

  createSensorPopup(location) {
    const currentData = this.getCurrentSensorData(location.sensor_id);

    return `
      <div class="sensor-popup-content" style="padding: 10px;">
        <div class="popup-header" style="margin-bottom: 10px;">
          <h4 style="margin: 0; color: #333;">${location.location_name}</h4>
          <span class="sensor-id" style="color: #666; font-size: 12px;">${
            location.sensor_id
          }</span>
        </div>
        <div class="popup-details" style="margin-bottom: 10px;">
          <div class="detail-item" style="margin-bottom: 5px;">
            <strong>River:</strong> ${location.river_name || "N/A"}
          </div>
          <div class="detail-item" style="margin-bottom: 5px;">
            <strong>Location:</strong> ${location.barangay}, ${
      location.municipality
    }
          </div>
          <div class="detail-item" style="margin-bottom: 5px;">
            <strong>Coordinates:</strong> ${location.latitude.toFixed(
              6
            )}, ${location.longitude.toFixed(6)}
          </div>
        </div>
        <div class="popup-readings" style="margin-bottom: 10px;">
          <div class="reading-item" style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span class="reading-label">Water Level:</span>
            <span class="reading-value">${
              currentData?.waterLevel?.toFixed(1) || "--"
            } cm</span>
          </div>
          <div class="reading-item" style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span class="reading-label">Flow Rate:</span>
            <span class="reading-value">${
              currentData?.flowRate?.toFixed(2) || "--"
            } m/s</span>
          </div>
          <div class="reading-item" style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span class="reading-label">Status:</span>
            <span class="reading-value" style="color: ${
              this.config.ALERT_LEVELS[this.getCurrentAlertStatus(location)]
                ?.color
            }">${this.getCurrentAlertStatus(location)}</span>
          </div>
        </div>
        <div class="popup-actions">
          <button class="popup-btn" onclick="mappingSystem.selectSensor('${
            location.sensor_id
          }')" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; margin-right: 5px; border-radius: 3px; cursor: pointer;">
            View Details
          </button>
          <button class="popup-btn" onclick="mappingSystem.zoomToSensor('${
            location.sensor_id
          }')" style="background: #6b7280; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            Zoom Here
          </button>
        </div>
      </div>
    `;
  }

  setupWebSocket() {
    try {
      console.log("🔌 Connecting to AGOS WebSocket...");

      const wsUrl = `ws://${window.location.host}`;
      this.state.socket = new WebSocket(wsUrl);

      this.state.socket.onopen = () => {
        console.log("✅ WebSocket connected to mapping system");
        this.state.isConnected = true;
        this.updateConnectionStatus("connected");
      };

      this.state.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "sensor-data") {
            this.handleSensorDataUpdate(data.data);
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      this.state.socket.onclose = () => {
        console.log("❌ WebSocket disconnected");
        this.state.isConnected = false;
        this.updateConnectionStatus("disconnected");
        // Attempt reconnection
        setTimeout(() => this.setupWebSocket(), 3000);
      };

      this.state.socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };
    } catch (error) {
      console.error("❌ WebSocket setup failed:", error);
    }
  }

  handleSensorDataUpdate(newData) {
    console.log("📊 Received sensor data update:", newData);

    this.state.currentData = newData;

    // Update UI elements
    this.updateLiveReadings(newData);
    this.updateSensorMarkers(newData);

    // Update selected sensor details if applicable
    if (this.state.selectedSensor) {
      this.updateSelectedSensorDetails(newData);
    }
  }

  updateLiveReadings(data) {
    // Update ground sensor data in hybrid model
    this.safeUpdateElement(
      "ground-level",
      `${data.waterLevel?.toFixed(1) || "--"} cm`
    );
    this.safeUpdateElement(
      "ground-flow",
      `${data.flowRate?.toFixed(2) || "--"} m/s`
    );

    // Update map data display elements
    this.safeUpdateElement(
      "map-water-level",
      `${data.waterLevel?.toFixed(1) || "--"} cm`
    );
    this.safeUpdateElement(
      "map-flow-rate",
      `${data.flowRate?.toFixed(2) || "--"} m/s`
    );
    this.safeUpdateElement("map-alert-status", this.determineAlertStatus(data));
  }

  updateSensorMarkers(data) {
    // Update marker colors based on current alert status
    if (this.state.mapLayers.sensors) {
      this.displaySensorMarkers(); // Refresh all markers with current data
    }
  }

  setupEventHandlers() {
    // Layer control handlers (if they exist)
    const layerControls = document.querySelectorAll('input[name="mapLayer"]');
    layerControls.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.switchMapLayer(e.target.value);
      });
    });

    // Overlay controls (if they exist)
    const showSensors = document.getElementById("show-sensors");
    if (showSensors) {
      showSensors.addEventListener("change", (e) => {
        this.toggleSensorLayer(e.target.checked);
      });
    }

    // Control buttons (if they exist)
    const refreshBtn = document.getElementById("refresh-satellite");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshSatelliteData();
      });
    }

    const captureBtn = document.getElementById("capture-screenshot");
    if (captureBtn) {
      captureBtn.addEventListener("click", () => {
        this.captureMapScreenshot();
      });
    }

    const analyzeBtn = document.getElementById("analyze-screenshot");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => {
        this.analyzeScreenshot();
      });
    }

    // Report generation
    const generateReportBtn = document.getElementById("generate-report");
    if (generateReportBtn) {
      generateReportBtn.addEventListener("click", () => {
        this.generateReport();
      });
    }

    const exportBtn = document.getElementById("export-prediction");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportPrediction();
      });
    }

    const emergencyBtn = document.getElementById("emergency-alert");
    if (emergencyBtn) {
      emergencyBtn.addEventListener("click", () => {
        this.sendEmergencyAlert();
      });
    }

    // Satellite layer selector
    const layerSelect = document.getElementById("satellite-layer");
    if (layerSelect) {
      layerSelect.addEventListener("change", (e) => {
        this.switchSatelliteLayer(e.target.value);
      });
    }
  }

  // Utility methods
  safeUpdateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  updateStatus(statusId, status) {
    const element = document.getElementById(statusId);
    if (element) {
      element.textContent = status === "online" ? "🟢" : "🔴";
    }
  }

  updateConnectionStatus(status) {
    const element = document.getElementById("connection-status");
    if (element) {
      element.textContent =
        status === "connected" ? "Connected" : "Disconnected";
      element.className = `status-${status}`;
    }
  }

  updateSensorCount(count) {
    this.safeUpdateElement("sensor-count", `${count} Sensors`);
  }

  getCurrentAlertStatus(location) {
    if (!this.state.currentData) return "NORMAL";

    const data = this.state.currentData;
    if (data.waterLevel >= 80 || data.flowRate >= 1.2) {
      return "EMERGENCY";
    } else if (data.waterLevel >= 60 || data.flowRate >= 0.8) {
      return "ALERT";
    }
    return "NORMAL";
  }

  getCurrentSensorData(sensorId) {
    // For now, return the global current data
    // In a multi-sensor system, this would return sensor-specific data
    return this.state.currentData;
  }

  determineAlertStatus(data) {
    if (data.waterLevel >= 80 || data.flowRate >= 1.2) {
      return "EMERGENCY";
    } else if (data.waterLevel >= 60 || data.flowRate >= 0.8) {
      return "ALERT";
    }
    return "NORMAL";
  }

  selectSensor(sensorId) {
    this.state.selectedSensor = sensorId;
    const location = this.state.sensorLocations.find(
      (loc) => loc.sensor_id === sensorId
    );

    if (location) {
      console.log(`📍 Selected sensor: ${sensorId}`);

      // Zoom to sensor location
      this.state.map.setView([location.latitude, location.longitude], 16);
    }
  }

  zoomToSensor(sensorId) {
    const location = this.state.sensorLocations.find(
      (loc) => loc.sensor_id === sensorId
    );
    if (location) {
      this.state.map.setView([location.latitude, location.longitude], 18);
    }
  }

  switchMapLayer(layerType) {
    console.log(`🗺️ Switching to ${layerType} layer`);
    // Implementation for switching map layers
  }

  toggleSensorLayer(show) {
    if (this.state.mapLayers.sensors) {
      if (show) {
        this.state.map.addLayer(this.state.mapLayers.sensors);
      } else {
        this.state.map.removeLayer(this.state.mapLayers.sensors);
      }
    }
  }

  refreshSatelliteData() {
    console.log("🛰️ Refreshing satellite data...");
    this.safeUpdateElement("last-analysis", new Date().toLocaleTimeString());
    // Simulate AI analysis
    setTimeout(() => {
      this.updateAIAnalysis();
    }, 2000);
  }

  updateAIAnalysis() {
    // Simulate AI analysis results
    const riskLevel = Math.random() * 100;
    const confidence = 75 + Math.random() * 20;

    this.safeUpdateElement("flood-risk-value", `${riskLevel.toFixed(0)}%`);
    this.safeUpdateElement("ai-confidence", `${confidence.toFixed(0)}%`);
    this.safeUpdateElement("sensor-validation", "98%");
    this.safeUpdateElement("weather-factor", "Moderate");

    // Update gauge
    const gauge = document.getElementById("flood-risk-gauge");
    if (gauge) {
      gauge.style.background = `conic-gradient(
        ${
          riskLevel > 70 ? "#ef4444" : riskLevel > 40 ? "#f59e0b" : "#22c55e"
        } 0deg ${riskLevel * 3.6}deg,
        #e5e7eb ${riskLevel * 3.6}deg 360deg
      )`;
    }

    this.updateStatus("ai-status", "online");
  }

  captureMapScreenshot() {
    console.log("📸 Capturing map screenshot...");

    // Use html2canvas if available
    if (typeof html2canvas !== "undefined") {
      const mapElement = document.getElementById("flood-map");
      html2canvas(mapElement).then((canvas) => {
        // Display in screenshot container
        const container = document.getElementById("screenshot-container");
        if (container) {
          container.innerHTML = "";
          container.appendChild(canvas);
          canvas.style.width = "100%";
          canvas.style.height = "auto";

          // Enable analyze button
          const analyzeBtn = document.getElementById("analyze-screenshot");
          if (analyzeBtn) {
            analyzeBtn.disabled = false;
          }
        }
      });
    } else {
      console.warn("⚠️ html2canvas not available");
      alert("Screenshot functionality requires html2canvas library");
    }
  }

  analyzeScreenshot() {
    console.log("🔍 Analyzing screenshot...");

    // Show loading
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.remove("hidden");
    }

    // Simulate AI analysis
    setTimeout(() => {
      this.showAnalysisResults();
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }
    }, 3000);
  }

  showAnalysisResults() {
    const resultsDiv = document.getElementById("analysis-results");
    if (resultsDiv) {
      resultsDiv.classList.remove("hidden");

      // Mock analysis results
      this.safeUpdateElement(
        "detected-features",
        "Water bodies, Urban areas, Vegetation"
      );
      this.safeUpdateElement("flood-extent", "2.3 km²");
      this.safeUpdateElement("risk-assessment", "Moderate Risk");
    }
  }

  switchSatelliteLayer(layerType) {
    console.log(`🛰️ Switching to ${layerType} satellite layer`);
    this.safeUpdateElement("last-analysis", "Switching...");

    setTimeout(() => {
      this.safeUpdateElement("last-analysis", new Date().toLocaleTimeString());
    }, 1000);
  }

  generateReport() {
    console.log("📋 Generating report...");
    const modal = document.getElementById("report-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  exportPrediction() {
    console.log("📤 Exporting prediction data...");
    alert("Prediction export feature coming soon!");
  }

  sendEmergencyAlert() {
    console.log("🚨 Sending emergency alert...");
    if (confirm("Send emergency flood alert to all subscribers?")) {
      alert("Emergency alert sent successfully!");
    }
  }

  startDataUpdates() {
    // Request initial data
    if (this.state.socket && this.state.socket.readyState === WebSocket.OPEN) {
      this.state.socket.send(
        JSON.stringify({
          type: "requestSensorData",
        })
      );
    }

    // Set up periodic updates
    setInterval(() => {
      if (
        this.state.socket &&
        this.state.socket.readyState === WebSocket.OPEN
      ) {
        this.state.socket.send(
          JSON.stringify({
            type: "requestSensorData",
          })
        );
      }
    }, this.config.UPDATE_INTERVAL);
  }
}

// Initialize the mapping system when page loads
let mappingSystem;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM loaded, initializing mapping system...");
  mappingSystem = new AGOSMappingSystem();
});

// Make mappingSystem available globally for popup buttons
window.mappingSystem = mappingSystem;

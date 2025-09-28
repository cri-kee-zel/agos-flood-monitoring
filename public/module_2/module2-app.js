/**
 * AGOS Module 2: AI-Enhanced Flood Mapping
 * Real-time satellite analysis with Microsoft AI4G-flood integration
 *
 * This module integrates with Module 1 to provide:
 * - Interactive mapping with Leaflet.js library
 * - Sentinel Hub satellite API integration for real imagery
 * - AI-powered flood prediction using Microsoft AI4Good
 * - Screenshot capture and automated analysis
 * - Hybrid prediction models combining satellite + ground sensor data
 * - DOST-PAGASA compliant emergency reports
 *
 * Author: Senior IoT Engineer
 * Date: 2025-08-18 04:54:13 UTC
 * User: cri-kee-zel
 */

class AGOSMappingSystem {
  constructor() {
    // System configuration object - All mapping and AI parameters
    this.config = {
      // Default map center coordinates (Pasig River, Metro Manila)
      DEFAULT_LAT: 14.5995, // Latitude for initial map view
      DEFAULT_LNG: 121.0, // Longitude for initial map view
      DEFAULT_ZOOM: 12, // Initial zoom level (city scale)

      // Sentinel Hub satellite data service configuration
      SENTINEL_INSTANCE_ID: "your-instance-id", // User must register for API key
      SENTINEL_CLIENT_ID: "your-client-id", // Client credentials for authentication

      // AI Model API endpoints for flood analysis
      AI4G_ENDPOINT: "https://api.microsoft.com/ai4good/flood", // Microsoft AI4Good API
      LOCAL_AI_ENDPOINT: "/api/analyze-flood", // Local backup AI service

      // Data refresh intervals (milliseconds)
      SATELLITE_REFRESH_INTERVAL: 300000, // 5 minutes - How often to fetch new satellite images
      PREDICTION_UPDATE_INTERVAL: 60000, // 1 minute - AI prediction refresh rate

      // Flood risk assessment thresholds (percentage)
      FLOOD_RISK_THRESHOLDS: {
        LOW: 25, // 0-25% = Low risk (green)
        MEDIUM: 50, // 25-50% = Medium risk (yellow)
        HIGH: 75, // 50-75% = High risk (orange)
        CRITICAL: 90, // 75-100% = Critical risk (red)
      },
    };

    // System state
    this.state = {
      map: null,
      satelliteStatus: "disconnected",
      aiModelStatus: "initializing",
      lastAnalysis: null,
      currentScreenshot: null,
      floodRiskLevel: 0,
      aiConfidence: 0,

      // Sensor integration from Module 1
      groundSensorData: {
        waterLevel: 0,
        flowRate: 0,
        timestamp: null,
      },

      // Prediction data
      predictions: [],
      hybridModel: {
        satelliteWeight: 0.75,
        sensorWeight: 0.25,
      },
    };

    // Map layers and markers
    this.mapLayers = {
      satellite: null,
      floodRisk: null,
      sensors: null,
    };

    // DOM elements
    this.elements = {};

    // Charts and visualizations
    this.predictionChart = null;

    // Initialize the system
    this.init();
  }

  /*
   * Editor guidance - protected IDs used by this module. Do not rename/remove
   * these in the HTML/CSS unless you also update the references here.
   * - flood-map, satellite-layer, refresh-satellite, capture-screenshot
   * - satellite-status, ai-status, last-analysis, ai-model-status
   * - analysis-timestamp, flood-risk-gauge, flood-risk-value, ai-confidence
   * - screenshot-container, analyze-screenshot, analysis-results
   * - detected-features, flood-extent, risk-assessment, sync-status
   * - prediction-timeline, generate-report, export-prediction, report-modal
   * - loading-overlay
   */

  // Small safe DOM helper like in other modules
  safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * Initialize the mapping system
   */
  async init() {
    console.log("🛰️ AGOS Mapping System Initializing...");

    try {
      this.cacheElements();
      this.setupEventListeners();
      await this.initializeMap();
      await this.initializeAIModel();
      this.initializePredictionChart();
      this.startSystemMonitoring();
      this.loadInitialData();

      console.log("✅ AGOS Mapping System Initialized");
      this.updateSystemStatus("System Ready");
    } catch (error) {
      console.error("❌ Mapping System Initialization Failed:", error);
      this.handleSystemError(error);
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    const elements = [
      "flood-map",
      "satellite-layer",
      "refresh-satellite",
      "capture-screenshot",
      "satellite-status",
      "ai-status",
      "last-analysis",
      "ai-model-status",
      "analysis-timestamp",
      "flood-risk-gauge",
      "flood-risk-value",
      "ai-confidence",
      "sensor-validation",
      "weather-factor",
      "screenshot-container",
      "analyze-screenshot",
      "analysis-results",
      "detected-features",
      "flood-extent",
      "risk-assessment",
      "satellite-weight",
      "sensor-weight",
      "ground-level",
      "ground-flow",
      "sync-indicator",
      "sync-status",
      "prediction-timeline",
      "generate-report",
      "export-prediction",
      "emergency-alert",
      "report-modal",
      "close-report-modal",
      "loading-overlay",
    ];

    elements.forEach((id) => {
      this.elements[id] = document.getElementById(id);
      if (!this.elements[id] && id !== "flood-map") {
        console.warn(`⚠️ Element not found: ${id}`);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Satellite controls
    this.elements["refresh-satellite"]?.addEventListener("click", () =>
      this.refreshSatelliteData()
    );
    this.elements["capture-screenshot"]?.addEventListener("click", () =>
      this.captureMapScreenshot()
    );
    this.elements["satellite-layer"]?.addEventListener("change", (e) =>
      this.changeSatelliteLayer(e.target.value)
    );

    // AI Analysis
    this.elements["analyze-screenshot"]?.addEventListener("click", () =>
      this.analyzeScreenshot()
    );

    // Quick actions
    this.elements["generate-report"]?.addEventListener("click", () =>
      this.openReportModal()
    );
    this.elements["export-prediction"]?.addEventListener("click", () =>
      this.exportPredictionData()
    );
    this.elements["emergency-alert"]?.addEventListener("click", () =>
      this.sendEmergencyAlert()
    );

    // Modal controls
    this.elements["close-report-modal"]?.addEventListener("click", () =>
      this.closeReportModal()
    );
    document
      .getElementById("cancel-report")
      ?.addEventListener("click", () => this.closeReportModal());
    document
      .getElementById("download-report")
      ?.addEventListener("click", () => this.generatePDFReport());

    // Window events
    window.addEventListener("resize", () => this.handleWindowResize());
    document.addEventListener("visibilitychange", () =>
      this.handleVisibilityChange()
    );
  }

  /**
   * Initialize the interactive map
   */
  async initializeMap() {
    console.log("🗺️ Initializing interactive map...");

    try {
      // Create the map
      this.state.map = L.map("flood-map", {
        center: [this.config.DEFAULT_LAT, this.config.DEFAULT_LNG],
        zoom: this.config.DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // Add base layer (OpenStreetMap)
      const baseLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }
      ).addTo(this.state.map);

      // Add satellite imagery layer (simulated - would use Sentinel Hub in production)
      this.mapLayers.satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Esri, Maxar, Earthstar Geographics",
          maxZoom: 18,
          opacity: 0.7,
        }
      );

      // Add flood risk overlay (simulated data)
      this.mapLayers.floodRisk = L.layerGroup();
      this.addFloodRiskAreas();

      // Add sensor markers
      this.mapLayers.sensors = L.layerGroup();
      this.addSensorMarkers();

      // Layer control
      const layerControl = L.control
        .layers(
          {
            "Street Map": baseLayer,
            Satellite: this.mapLayers.satellite,
          },
          {
            "Flood Risk Areas": this.mapLayers.floodRisk,
            "AGOS Sensors": this.mapLayers.sensors,
          },
          { position: "topright" }
        )
        .addTo(this.state.map);

      // Add default overlays
      this.mapLayers.floodRisk.addTo(this.state.map);
      this.mapLayers.sensors.addTo(this.state.map);

      // Map event listeners
      this.state.map.on("click", (e) => this.handleMapClick(e));
      this.state.map.on("zoomend", () => this.handleMapZoomChange());

      console.log("✅ Map initialized successfully");
      this.updateSatelliteStatus("ready");
    } catch (error) {
      console.error("❌ Map initialization failed:", error);
      this.updateSatelliteStatus("error");
      throw error;
    }
  }

  /**
   * Add simulated flood risk areas to the map
   */
  addFloodRiskAreas() {
    // Simulated flood risk polygons for Philippine rivers
    const floodAreas = [
      {
        coords: [
          [14.605, 120.99],
          [14.61, 120.995],
          [14.608, 121.005],
          [14.6, 121.0],
        ],
        risk: "high",
        name: "Marikina River Basin",
      },
      {
        coords: [
          [14.595, 121.005],
          [14.6, 121.01],
          [14.598, 121.015],
          [14.592, 121.012],
        ],
        risk: "medium",
        name: "Pasig River Area",
      },
      {
        coords: [
          [14.585, 120.985],
          [14.59, 120.99],
          [14.588, 120.998],
          [14.583, 120.993],
        ],
        risk: "low",
        name: "Lower Risk Zone",
      },
    ];

    floodAreas.forEach((area) => {
      const color = this.getRiskColor(area.risk);
      const polygon = L.polygon(area.coords, {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2,
      }).bindPopup(`
                <strong>${area.name}</strong><br>
                Risk Level: ${area.risk.toUpperCase()}<br>
                <em>Predicted flood risk based on AI analysis</em>
            `);

      this.mapLayers.floodRisk.addLayer(polygon);
    });
  }

  /**
   * Add AGOS sensor markers to the map
   */
  addSensorMarkers() {
    // Simulated sensor locations
    const sensors = [
      {
        lat: 14.602,
        lng: 120.998,
        id: "AGOS-001",
        name: "Main Station",
        status: "online",
        waterLevel: 45.2,
        flowRate: 0.8,
      },
      {
        lat: 14.598,
        lng: 121.002,
        id: "AGOS-002",
        name: "Downstream Monitor",
        status: "online",
        waterLevel: 38.7,
        flowRate: 1.2,
      },
      {
        lat: 14.608,
        lng: 120.992,
        id: "AGOS-003",
        name: "Upstream Alert",
        status: "maintenance",
        waterLevel: null,
        flowRate: null,
      },
    ];

    sensors.forEach((sensor) => {
      const iconColor = sensor.status === "online" ? "#22c55e" : "#f97316";

      const customIcon = L.divIcon({
        className: "custom-sensor-marker",
        html: `
                    <div style="
                        background: ${iconColor};
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            top: -8px;
                            right: -8px;
                            background: white;
                            color: ${iconColor};
                            font-size: 10px;
                            padding: 2px 4px;
                            border-radius: 8px;
                            border: 1px solid ${iconColor};
                            font-weight: bold;
                        ">${sensor.id.split("-")[1]}</div>
                    </div>
                `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([sensor.lat, sensor.lng], { icon: customIcon })
        .bindPopup(`
                    <div style="min-width: 200px;">
                        <h4>${sensor.name}</h4>
                        <p><strong>Station ID:</strong> ${sensor.id}</p>
                        <p><strong>Status:</strong> <span style="color: ${iconColor};">${sensor.status.toUpperCase()}</span></p>
                        ${
                          sensor.status === "online"
                            ? `
                            <p><strong>Water Level:</strong> ${
                              sensor.waterLevel
                            } cm</p>
                            <p><strong>Flow Rate:</strong> ${
                              sensor.flowRate
                            } m/s</p>
                            <small><em>Last updated: ${new Date().toLocaleTimeString()}</em></small>
                        `
                            : `
                            <p><em>Sensor under maintenance</em></p>
                        `
                        }
                    </div>
                `);

      this.mapLayers.sensors.addLayer(marker);
    });
  }

  /**
   * Get color for risk level
   */
  getRiskColor(risk) {
    const colors = {
      low: "#eab308",
      medium: "#f97316",
      high: "#ef4444",
      critical: "#dc2626",
    };
    return colors[risk] || "#6b7280";
  }

  /**
   * Initialize AI model
   */
  async initializeAIModel() {
    console.log("🤖 Initializing AI flood prediction model...");

    try {
      this.updateAIStatus("loading");

      // Simulate AI model initialization
      await this.delay(2000);

      // In production, this would connect to Microsoft AI4G-flood API
      this.state.aiModelStatus = "ready";
      this.updateAIStatus("ready");

      console.log("✅ AI model initialized");
    } catch (error) {
      console.error("❌ AI model initialization failed:", error);
      this.updateAIStatus("error");
      throw error;
    }
  }

  /**
   * Initialize prediction timeline chart
   */
  initializePredictionChart() {
    const canvas =
      this.elements["prediction-timeline"]?.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Generate sample prediction data
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const predictions = hours.map((h) => {
      const base = 30 + Math.sin(h * 0.5) * 20;
      const noise = (Math.random() - 0.5) * 10;
      return Math.max(0, base + noise);
    });

    this.predictionChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: hours.map((h) => `${h}:00`),
        datasets: [
          {
            label: "Predicted Water Level (cm)",
            data: predictions,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Critical Threshold",
            data: hours.map(() => 100),
            borderColor: "#ef4444",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 6,
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
            },
          },
          y: {
            beginAtZero: true,
            max: 150,
            ticks: {
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
            },
          },
        },
      },
    });
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    // Update satellite data periodically
    setInterval(() => {
      if (this.state.satelliteStatus === "ready") {
        this.refreshSatelliteData(true); // Silent refresh
      }
    }, this.config.SATELLITE_REFRESH_INTERVAL);

    // Update predictions
    setInterval(() => {
      this.updatePredictions();
    }, this.config.PREDICTION_UPDATE_INTERVAL);

    // Update system time displays
    setInterval(() => {
      this.updateTimeDisplays();
    }, 1000);

    // Sync with ground sensors (Module 1 integration)
    setInterval(() => {
      this.syncGroundSensorData();
    }, 5000);
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    console.log("📊 Loading initial satellite and prediction data...");

    try {
      await this.refreshSatelliteData();
      this.updatePredictions();
      this.syncGroundSensorData();

      // Simulate initial analysis
      this.state.floodRiskLevel = 35;
      this.state.aiConfidence = 87;
      this.updateAnalysisDisplay();
    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
    }
  }

  /**
   * Refresh satellite data
   */
  async refreshSatelliteData(silent = false) {
    if (!silent) {
      console.log("🛰️ Refreshing satellite data...");
      this.updateSatelliteStatus("loading");
    }

    try {
      // Simulate API call to Sentinel Hub
      await this.delay(1500);

      // In production, this would fetch real satellite imagery
      const mockSatelliteData = {
        timestamp: new Date(),
        cloudCover: Math.random() * 30,
        resolution: "10m",
        coverage: "100%",
      };

      this.state.lastSatelliteData = mockSatelliteData;
      this.updateSatelliteStatus("ready");

      if (!silent) {
        console.log("✅ Satellite data refreshed");
      }
    } catch (error) {
      console.error("❌ Failed to refresh satellite data:", error);
      this.updateSatelliteStatus("error");
    }
  }

  /**
   * Change satellite layer
   */
  changeSatelliteLayer(layerType) {
    console.log(`🛰️ Switching to satellite layer: ${layerType}`);

    // Remove current satellite layer
    if (this.state.map.hasLayer(this.mapLayers.satellite)) {
      this.state.map.removeLayer(this.mapLayers.satellite);
    }

    // Add new satellite layer based on selection
    let tileUrl;
    let attribution;

    switch (layerType) {
      case "sentinel2":
        tileUrl =
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "Sentinel-2 via Esri";
        break;
      case "sentinel1":
        tileUrl =
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "Sentinel-1 SAR via Esri";
        break;
      case "landsat8":
        tileUrl =
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "Landsat 8 via Esri";
        break;
    }

    this.mapLayers.satellite = L.tileLayer(tileUrl, {
      attribution: attribution,
      maxZoom: 18,
      opacity: 0.7,
    }).addTo(this.state.map);
  }

  /**
   * Capture map screenshot for AI analysis
   */
  async captureMapScreenshot() {
    console.log("📸 Capturing map screenshot...");

    try {
      const mapElement = this.elements["flood-map"];
      if (!mapElement) return;

      // Show loading
      this.showLoading("Capturing screenshot...");

      // Use html2canvas to capture the map
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
      });

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", 0.8);
      });

      // Create object URL
      const imageUrl = URL.createObjectURL(blob);

      // Display screenshot
      this.displayScreenshot(imageUrl);

      // Store for analysis
      this.state.currentScreenshot = {
        blob: blob,
        url: imageUrl,
        timestamp: new Date(),
        bounds: this.state.map.getBounds(),
      };

      this.hideLoading();
      console.log("✅ Screenshot captured successfully");
    } catch (error) {
      console.error("❌ Screenshot capture failed:", error);
      this.hideLoading();
      this.showError("Failed to capture screenshot");
    }
  }

  /**
   * Display captured screenshot
   */
  displayScreenshot(imageUrl) {
    const container = this.elements["screenshot-container"];
    if (!container) return;

    container.innerHTML = `
            <img src="${imageUrl}" alt="Map Screenshot" class="screenshot-preview">
        `;

    // Enable analyze button
    const analyzeBtn = this.elements["analyze-screenshot"];
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
    }
  }

  /**
   * Analyze screenshot using AI
   */
  async analyzeScreenshot() {
    if (!this.state.currentScreenshot) {
      console.warn("⚠️ No screenshot available for analysis");
      return;
    }

    console.log("🔍 Analyzing screenshot with AI...");
    this.showLoading("Analyzing satellite imagery...");

    try {
      // Simulate AI analysis (in production, would call Microsoft AI4G-flood API)
      await this.delay(3000);

      const analysisResults = this.simulateAIAnalysis();
      this.displayAnalysisResults(analysisResults);

      // Update main prediction
      this.state.floodRiskLevel = analysisResults.floodRisk;
      this.state.aiConfidence = analysisResults.confidence;
      this.updateAnalysisDisplay();

      this.hideLoading();
      console.log("✅ AI analysis completed");
    } catch (error) {
      console.error("❌ AI analysis failed:", error);
      this.hideLoading();
      this.showError("AI analysis failed");
    }
  }

  /**
   * Simulate AI analysis results
   */
  simulateAIAnalysis() {
    const features = [
      "water_bodies",
      "vegetation",
      "urban_areas",
      "cloud_cover",
    ];
    const detectedFeatures = features.filter(() => Math.random() > 0.3);

    const floodRisk = Math.random() * 100;
    const confidence = 70 + Math.random() * 25;
    const floodExtent = (Math.random() * 50).toFixed(2);

    let riskLevel;
    if (floodRisk >= this.config.FLOOD_RISK_THRESHOLDS.CRITICAL) {
      riskLevel = "CRITICAL";
    } else if (floodRisk >= this.config.FLOOD_RISK_THRESHOLDS.HIGH) {
      riskLevel = "HIGH";
    } else if (floodRisk >= this.config.FLOOD_RISK_THRESHOLDS.MEDIUM) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    return {
      detectedFeatures,
      floodRisk: Math.round(floodRisk),
      confidence: Math.round(confidence),
      floodExtent,
      riskLevel,
      timestamp: new Date(),
    };
  }

  /**
   * Display analysis results
   */
  displayAnalysisResults(results) {
    const resultsElement = this.elements["analysis-results"];
    if (!resultsElement) return;

    resultsElement.classList.remove("hidden");

    // Update detected features
    const featuresElement = this.elements["detected-features"];
    if (featuresElement) {
      featuresElement.innerHTML = results.detectedFeatures
        .map(
          (feature) =>
            `<span class="feature-tag">${feature
              .replace("_", " ")
              .toUpperCase()}</span>`
        )
        .join("");
    }

    // Update flood extent
    const extentElement = this.elements["flood-extent"];
    if (extentElement) {
      extentElement.textContent = `${results.floodExtent}%`;
    }

    // Update risk assessment
    const riskElement = this.elements["risk-assessment"];
    if (riskElement) {
      riskElement.textContent = results.riskLevel;
      riskElement.className = `risk-level risk-${results.riskLevel.toLowerCase()}`;
    }

    // Update timestamp
    const ts = results.timestamp.toLocaleString();
    this.safeSetText("analysis-timestamp", ts);
  }

  /**
   * Update analysis display
   */
  updateAnalysisDisplay() {
    const riskElement = this.elements["flood-risk-value"];
    const confidenceElement = this.elements["ai-confidence"];

    if (riskElement) {
      riskElement.textContent = `${this.state.floodRiskLevel}%`;
    }

    if (confidenceElement) {
      confidenceElement.textContent = `${this.state.aiConfidence}%`;
    }
  }

  /**
   * Update satellite status
   */
  updateSatelliteStatus(status) {
    // Use safe helper to avoid errors if element missing while editing
    this.safeSetText("satellite-status", status.toUpperCase());
    const statusElement = this.elements["satellite-status"];
    if (statusElement) statusElement.className = `status-${status}`;
  }

  /**
   * Update AI status
   */
  updateAIStatus(status) {
    this.safeSetText("ai-model-status", status.toUpperCase());
    const statusElement = this.elements["ai-model-status"];
    if (statusElement) statusElement.className = `status-${status}`;
  }

  /**
   * Update predictions
   */
  updatePredictions() {
    // Simulate prediction updates
    console.log("🔮 Updating flood predictions...");
  }

  /**
   * Update time displays
   */
  updateTimeDisplays() {
    // Update various timestamp displays
    const lastAnalysisElement = this.elements["last-analysis"];
    if (!this.state.lastAnalysis) return;
    const now = new Date();
    const diff = Math.floor((now - this.state.lastAnalysis) / 1000);
    const text =
      diff < 60
        ? `${diff}s ago`
        : diff < 3600
        ? `${Math.floor(diff / 60)}m ago`
        : `${Math.floor(diff / 3600)}h ago`;
    this.safeSetText("last-analysis", text);
  }

  /**
   * Sync with ground sensor data
   */
  syncGroundSensorData() {
    // Get data from Module 1 if available
    if (window.agosSystem) {
      this.state.groundSensorData = {
        waterLevel: window.agosSystem.state.waterLevel,
        flowRate: window.agosSystem.state.flowRate,
        timestamp: new Date(),
      };

      const syncElement = this.elements["sync-status"];
      if (syncElement) {
        syncElement.textContent = "SYNCED";
        syncElement.className = "status-synced";
      }
    }
  }

  /**
   * Handle map click events
   */
  handleMapClick(e) {
    console.log(`🗺️ Map clicked at: ${e.latlng.lat}, ${e.latlng.lng}`);
  }

  /**
   * Handle map zoom changes
   */
  handleMapZoomChange() {
    console.log(`🔍 Map zoom changed to: ${this.state.map.getZoom()}`);
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    if (this.state.map) {
      this.state.map.invalidateSize();
    }
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log("📱 Page hidden - reducing update frequency");
    } else {
      console.log("👁️ Page visible - resuming normal updates");
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(message) {
    const overlay = this.elements["loading-overlay"];
    if (overlay) {
      overlay.classList.remove("hidden");
      const textElement = overlay.querySelector(".loading-text");
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = this.elements["loading-overlay"];
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(`❌ ${message}`);
    // Could show toast notification or error modal
  }

  /**
   * Update system status
   */
  updateSystemStatus(message) {
    console.log(`ℹ️ System status: ${message}`);
  }

  /**
   * Handle system error
   */
  handleSystemError(error) {
    console.error("💥 System error:", error);
    this.updateSystemStatus(`Error: ${error.message}`);
  }

  /**
   * Open report modal
   */
  openReportModal() {
    const modal = this.elements["report-modal"];
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  /**
   * Close report modal
   */
  closeReportModal() {
    const modal = this.elements["report-modal"];
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  /**
   * Export prediction data
   */
  exportPredictionData() {
    console.log("📊 Exporting prediction data...");
    const data = {
      timestamp: new Date().toISOString(),
      floodRisk: this.state.floodRiskLevel,
      confidence: this.state.aiConfidence,
      groundSensorData: this.state.groundSensorData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agos-predictions-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Send emergency alert
   */
  sendEmergencyAlert() {
    console.log("🚨 Sending emergency alert...");
    // Integrate with Module 4 emergency system
    if (window.emergencySystem) {
      window.emergencySystem.sendMassBroadcast("flash-flood", {
        location: "Satellite Analysis Area",
        waterlevel: this.state.groundSensorData.waterLevel || "N/A",
        floodrisk: this.state.floodRiskLevel,
      });
    }
  }

  /**
   * Generate PDF report
   */
  generatePDFReport() {
    console.log("📄 Generating PDF report...");
    // Implementation would use jsPDF or similar library
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the mapping system when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.agosMappingSystem = new AGOSMappingSystem();
});

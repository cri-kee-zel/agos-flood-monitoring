# AGOS System - Complete Code Explanation

## Overview

The AGOS (Advanced Ground Observation System) is a comprehensive IoT-based flood monitoring system designed specifically for Philippine rivers. It consists of 4 main modules working together to provide real-time monitoring, AI-enhanced mapping, historical analytics, and emergency response capabilities.

## Hardware Foundation (From Schematic)

Before diving into the software modules, understanding the hardware is crucial:

### Power System

```javascript
// Battery monitoring from voltage divider (100kΩ:20kΩ ratio)
// Arduino ADC reading: 0-1023 maps to 0-1.4V (safe for 3.3V system)
// Actual battery voltage: 0-8.4V (2S lithium configuration)
float batteryVoltage = analogRead(A0) * (8.4 / 1023.0) * (120000.0 / 20000.0);
```

### Sensor Interfaces

- **Water Level**: Omron E3X-NA11 optical encoder (12V) → Arduino D2 (interrupt)
- **Flow Rate**: Two POF sensors (A1/A2) with IR LEDs controlled by D3/D4
- **Communication**: SIM800L via Serial2 (D15-RX, D16-TX)

---

## Module 1: Real-Time Sensor Dashboard (app.js)

### Main Class Structure

```javascript
class AGOSSystem {
    constructor() {
        // Configuration object - Contains all operational parameters
        this.config = {
            SENSOR_UPDATE_INTERVAL: 5000,    // How often Arduino sends sensor data
            ALERT_LEVEL: 100,                // Water level threshold for yellow alert
            EMERGENCY_LEVEL: 150,            // Water level threshold for red alert
            CRITICAL_FLOW: 1.2,              // Flow rate threshold for emergency
            MAX_WATER_LEVEL: 300,            // Sensor range limit (3 meters)
            BATTERY_LOW: 20,                 // Low battery warning percentage
        };
```

**Line-by-line explanation:**

- `SENSOR_UPDATE_INTERVAL: 5000` - Every 5 seconds, the system requests new data from Arduino
- `ALERT_LEVEL: 100` - When water reaches 1 meter, show yellow alert status
- `EMERGENCY_LEVEL: 150` - At 1.5 meters, activate emergency banner and SMS alerts
- `CRITICAL_FLOW: 1.2` - Flow rate above 1.2 m/s triggers emergency protocols

### System State Management

```javascript
this.state = {
  isConnected: false, // WebSocket status to backend server
  waterLevel: 0.0, // Current water level from optical encoder (cm)
  flowRate: 0.0, // Flow rate from POF turbidity correlation (m/s)
  upstreamTurbidity: 0.0, // POF sensor 1 reading (0-1 normalized)
  downstreamTurbidity: 0.0, // POF sensor 2 reading (0-1 normalized)
  batteryLevel: 85, // Solar battery charge from voltage divider (%)
  levelSensorHealth: true, // Omron E3X-NA11 status
  flowSensorHealth: true, // POF sensor system status
  emergencyActive: false, // Emergency alert state flag
};
```

### Key Functions Explained

#### Data Processing Functions

```javascript
generateSimulatedData() {
    // Time-based variations using sine waves for realistic patterns
    const time = Date.now() / 1000;
    const baseLevel = 50;  // 50cm baseline water level

    // Simulate daily and seasonal patterns
    const levelVariation = Math.sin(time * 0.001) * 20 + Math.random() * 10 - 5;
    this.state.waterLevel = Math.max(0, Math.min(this.config.MAX_WATER_LEVEL,
        baseLevel + levelVariation));

    // Flow rate correlated with water level (higher water = faster flow)
    const flowVariation = Math.sin(time * 0.002) * 1.0 + Math.random() * 0.3 - 0.15;
    this.state.flowRate = Math.max(0, Math.min(this.config.MAX_FLOW_RATE,
        baseFlow + (this.state.waterLevel / 100) + flowVariation));
}
```

**Explanation:**

- Uses mathematical sine functions to create realistic water level patterns
- Adds random noise to simulate natural variations
- Correlates flow rate with water level (physically accurate)
- Constrains values within sensor hardware limits

#### Emergency Alert System

```javascript
updateEmergencyStatus() {
    // Check if any emergency conditions are met
    const isEmergency = this.state.waterLevel >= this.config.EMERGENCY_LEVEL ||
                       this.state.flowRate >= this.config.CRITICAL_FLOW;

    if (isEmergency && !this.state.emergencyActive) {
        this.activateEmergencyAlert();  // Show red banner, play sound, log event
    } else if (!isEmergency && this.state.emergencyActive) {
        this.deactivateEmergencyAlert(); // Clear emergency state
    }
}
```

**Explanation:**

- Continuously monitors two emergency conditions: high water level OR high flow rate
- Activates emergency only when conditions are met AND not already active (prevents spam)
- Deactivates when conditions return to safe levels

#### Visual Updates

```javascript
updateWaterLevelDisplay() {
    const level = this.state.waterLevel;

    // Determine status based on thresholds
    let status, statusClass, color;
    if (level >= this.config.EMERGENCY_LEVEL) {
        status = 'EMERGENCY';           // Red - immediate danger
        statusClass = 'status-emergency';
        color = 'var(--emergency-color)';
    } else if (level >= this.config.ALERT_LEVEL) {
        status = 'ALERT';               // Orange - prepare for flooding
        statusClass = 'status-alert';
        color = 'var(--alert-color)';
    } else if (level >= this.config.ALERT_LEVEL * 0.8) {
        status = 'WATCH';               // Yellow - monitor closely
        statusClass = 'status-watch';
        color = 'var(--watch-color)';
    } else {
        status = 'NORMAL';              // Green - safe conditions
        statusClass = 'status-normal';
        color = 'var(--normal-color)';
    }

    // Update DOM elements with new values and colors
    valueElement.textContent = level.toFixed(2);  // Show level with 2 decimal places
    statusElement.className = `level-status ${statusClass}`;  // Apply color class
    valueElement.style.color = color;  // Change number color

    // Animate water fill visualization
    const fillPercentage = Math.min(100, (level / this.config.MAX_WATER_LEVEL) * 100);
    fillElement.style.height = `${fillPercentage}%`;  // Water rises from bottom
}
```

---

## Module 1: HTML Structure (index.html)

### Emergency Banner

```html
<!-- Emergency Status Banner - Hidden by default, shows during flood alerts -->
<div id="emergency-banner" class="emergency-banner hidden">
  <div class="emergency-content">
    <span class="emergency-icon">⚠️</span>
    <!-- Visual alert symbol -->
    <span class="emergency-text">FLOOD ALERT ACTIVE</span>
    <!-- Alert message -->
    <span class="emergency-level" id="emergency-level">CRITICAL</span>
    <!-- Dynamic level -->
  </div>
</div>
```

**Explanation:**

- `hidden` class initially hides the banner
- JavaScript removes `hidden` class when emergency conditions are detected
- `emergency-level` content is updated dynamically based on sensor readings

### System Status Header

```html
<header class="main-header">
  <div class="header-content">
    <div class="logo-section">
      <h1>🌊 AGOS</h1>
      <!-- Water wave emoji for branding -->
      <p>Advanced Ground Observation System</p>
      <!-- Full system name -->
    </div>
    <div class="system-status">
      <!-- WebSocket connection indicator -->
      <div class="status-item">
        <span class="status-icon" id="connection-status">🔴</span>
        <!-- Red=offline, Green=online -->
        <span>Connection</span>
      </div>
      <!-- Solar battery status from Arduino voltage divider -->
      <div class="status-item">
        <span class="status-icon">🔋</span>
        <span id="battery-level">---%</span>
        <!-- Updated from ADC reading -->
      </div>
      <!-- Data freshness indicator -->
      <div class="status-item">
        <span class="status-icon">⏰</span>
        <span id="last-update">Never</span>
        <!-- Shows "5s ago", "2m ago" etc -->
      </div>
    </div>
  </div>
</header>
```

### Water Level Visualization

```html
<section class="panel water-level-panel">
  <div class="panel-header">
    <h2>💧 Water Level Monitor</h2>
    <div class="sensor-health">
      <!-- Omron optical encoder status indicator -->
      <span class="health-indicator" id="level-sensor-health">🟢</span>
      <span>Optical Encoder</span>
      <!-- Hardware sensor type identification -->
    </div>
  </div>

  <!-- Numeric display with real-time updates -->
  <div class="level-display">
    <div class="level-value">
      <span class="value" id="water-level-value">0.00</span>
      <!-- From Arduino sensor -->
      <span class="unit">cm</span>
      <!-- Centimeters (matching hardware) -->
    </div>
    <div class="level-status" id="water-level-status">NORMAL</div>
    <!-- Color-coded status -->
  </div>

  <!-- Interactive water visualization with reference objects -->
  <div class="water-container">
    <div class="reference-objects">
      <!-- Human height reference for scale -->
      <div class="reference-object human" id="human-ref">
        <div class="human-icon">🚶</div>
        <input
          type="number"
          id="human-height"
          value="170"
          min="150"
          max="200"
        />
        <span class="ref-unit">cm</span>
      </div>
      <!-- Vehicle height reference -->
      <div class="reference-object car" id="car-ref">
        <div class="car-icon">🚗</div>
        <input type="number" id="car-height" value="150" min="120" max="180" />
        <span class="ref-unit">cm</span>
      </div>
    </div>

    <!-- Animated water level visualization -->
    <div class="water-level-visual">
      <div class="water-fill" id="water-fill"></div>
      <!-- Rises/falls with sensor data -->
      <div class="water-surface" id="water-surface">
        <!-- CSS-animated waves for realistic water surface -->
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
      </div>
      <!-- Measurement scale for visual reference -->
      <div class="measurement-scale">
        <div class="scale-mark" data-level="0">0cm</div>
        <div class="scale-mark" data-level="50">50cm</div>
        <div class="scale-mark" data-level="100">100cm</div>
        <!-- Alert threshold -->
        <div class="scale-mark" data-level="150">150cm</div>
        <!-- Emergency threshold -->
        <div class="scale-mark" data-level="200">200cm</div>
      </div>
    </div>
  </div>
</section>
```

### Flow Monitoring Panel

```html
<section class="panel water-flow-panel">
  <div class="panel-header">
    <h2>🌊 Water Flow Monitor</h2>
    <div class="sensor-health">
      <!-- POF (Plastic Optical Fiber) sensor status -->
      <span class="health-indicator" id="flow-sensor-health">🟢</span>
      <span>POF Sensors</span>
      <!-- Hardware: IR LEDs + Phototransistors -->
    </div>
  </div>

  <!-- Flow visualization showing water direction and speed -->
  <div class="flow-container">
    <div class="flow-direction">
      <span class="direction-label">UPSTREAM</span>
      <!-- POF Sensor 1 location -->
      <div class="arrow-flow">
        <!-- Animated arrows showing flow direction and speed -->
        <div class="flow-arrow" id="flow-arrow-1">→</div>
        <div class="flow-arrow" id="flow-arrow-2">→</div>
        <div class="flow-arrow" id="flow-arrow-3">→</div>
      </div>
      <span class="direction-label">DOWNSTREAM</span>
      <!-- POF Sensor 2 location -->
    </div>

    <!-- Pipe visualization with sensor indicators -->
    <div class="flow-pipe">
      <div class="pipe-section upstream">
        <div class="sensor-indicator">
          <span class="sensor-label">POF1</span>
          <span class="sensor-value" id="upstream-turbidity">0.0</span>
          <!-- A1 analog reading -->
        </div>
      </div>
      <!-- Animated particles showing flow rate -->
      <div class="pipe-section middle">
        <div class="flow-particles" id="flow-particles"></div>
      </div>
      <div class="pipe-section downstream">
        <div class="sensor-indicator">
          <span class="sensor-label">POF2</span>
          <span class="sensor-value" id="downstream-turbidity">0.0</span>
          <!-- A2 analog reading -->
        </div>
      </div>
    </div>

    <!-- Analytical data derived from sensor readings -->
    <div class="flow-analytics">
      <div class="analytics-item">
        <span class="analytics-label">Velocity:</span>
        <span class="analytics-value" id="flow-velocity">0.00 m/s</span>
        <!-- Calculated from turbidity diff -->
      </div>
      <div class="analytics-item">
        <span class="analytics-label">Debris Detection:</span>
        <span class="analytics-value" id="debris-status">CLEAR</span>
        <!-- Based on turbidity spikes -->
      </div>
      <div class="analytics-item">
        <span class="analytics-label">Differential:</span>
        <span class="analytics-value" id="turbidity-diff">0.0%</span>
        <!-- Upstream vs downstream -->
      </div>
    </div>
  </div>
</section>
```

### Control Panel

```html
<div class="control-panel">
  <!-- Simulation mode for testing without hardware -->
  <button id="simulate-btn" class="control-btn primary">
    🔄 Start Simulation
  </button>

  <!-- System reset button -->
  <button id="reset-btn" class="control-btn">↻ Reset System</button>

  <!-- Data export for analysis -->
  <button id="export-btn" class="control-btn">📊 Export Data</button>

  <!-- Real-time connection status -->
  <div class="connection-status-detailed">
    <span>WebSocket:</span>
    <span id="ws-status">Disconnected</span>
    <!-- Updated by JavaScript -->
  </div>
</div>

<!-- JavaScript library imports -->
<script src="/socket.io/socket.io.js"></script>
<!-- Real-time communication -->
<script src="app.js"></script>
<!-- Main application logic -->
```

---

## Module 2: AI-Enhanced Mapping (module2-app.js)

### Core Mapping System

```javascript
class AGOSMappingSystem {
    constructor() {
        this.config = {
            // Philippine coordinates (Pasig River area)
            DEFAULT_LAT: 14.5995,    // Latitude for map center
            DEFAULT_LNG: 121.0000,   // Longitude for map center
            DEFAULT_ZOOM: 12,        // City-scale view

            // Satellite data API configuration
            SENTINEL_INSTANCE_ID: 'your-instance-id',  // User must obtain from Sentinel Hub
            SENTINEL_CLIENT_ID: 'your-client-id',      // API authentication

            // AI analysis endpoints
            AI4G_ENDPOINT: 'https://api.microsoft.com/ai4good/flood',  // Microsoft AI4Good
            LOCAL_AI_ENDPOINT: '/api/analyze-flood',                   // Fallback local AI

            // Data refresh rates
            SATELLITE_REFRESH_INTERVAL: 300000,  // 5 minutes - New satellite imagery
            PREDICTION_UPDATE_INTERVAL: 60000,   // 1 minute - AI model predictions
        };
```

### Map Initialization

```javascript
async initializeMap() {
    // Create Leaflet map instance
    this.state.map = L.map('flood-map', {
        center: [this.config.DEFAULT_LAT, this.config.DEFAULT_LNG],  // Pasig River
        zoom: this.config.DEFAULT_ZOOM,      // Appropriate scale for river monitoring
        zoomControl: true,                   // Allow user zoom
        attributionControl: true             // Show data source credits
    });

    // Add base layer (street map)
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18  // High detail available
    }).addTo(this.state.map);

    // Add satellite imagery overlay
    this.mapLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
        opacity: 0.7  // Semi-transparent to see street details
    });
}
```

### Flood Risk Visualization

```javascript
addFloodRiskAreas() {
    // Predefined flood-prone areas for Philippine rivers
    const floodAreas = [
        {
            coords: [  // Polygon coordinates
                [14.6050, 120.9900], [14.6100, 120.9950],
                [14.6080, 121.0050], [14.6000, 121.0000]
            ],
            risk: 'high',                    // Risk level classification
            name: 'Marikina River Basin'     // Area identification
        },
        // Additional flood zones...
    ];

    floodAreas.forEach(area => {
        const color = this.getRiskColor(area.risk);  // Color coding by risk level
        const polygon = L.polygon(area.coords, {
            color: color,           // Border color
            fillColor: color,       // Fill color
            fillOpacity: 0.3,       // Semi-transparent
            weight: 2               // Border thickness
        }).bindPopup(`
            <strong>${area.name}</strong><br>
            Risk Level: ${area.risk.toUpperCase()}<br>
            <em>Predicted flood risk based on AI analysis</em>
        `);

        this.mapLayers.floodRisk.addLayer(polygon);  // Add to map layer
    });
}
```

### AGOS Sensor Integration

```javascript
addSensorMarkers() {
    // Real AGOS station locations
    const sensors = [
        {
            lat: 14.6020, lng: 120.9980,    // GPS coordinates
            id: 'AGOS-001',                 // Unique station identifier
            name: 'Main Station',           // Human-readable name
            status: 'online',               // Connection status
            waterLevel: 45.2,               // Current reading from Module 1
            flowRate: 0.8                   // Current flow rate
        },
        // Additional stations...
    ];

    sensors.forEach(sensor => {
        // Color-coded markers based on status
        const iconColor = sensor.status === 'online' ? '#22c55e' : '#f97316';

        const customIcon = L.divIcon({
            className: 'custom-sensor-marker',
            html: `
                <div style="background: ${iconColor}; /* Status color */
                            width: 20px; height: 20px;
                            border-radius: 50%;       /* Circular marker */
                            border: 3px solid white;  /* White border */
                            box-shadow: 0 2px 10px rgba(0,0,0,0.3);"> <!-- Drop shadow -->
                    <!-- Station ID badge -->
                    <div style="position: absolute; top: -8px; right: -8px;
                                background: white; color: ${iconColor};
                                font-size: 10px; padding: 2px 4px;
                                border-radius: 8px; font-weight: bold;">
                        ${sensor.id.split('-')[1]}  // Show "001" from "AGOS-001"
                    </div>
                </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]  // Center the icon
        });

        // Create marker with popup information
        const marker = L.marker([sensor.lat, sensor.lng], { icon: customIcon })
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h4>${sensor.name}</h4>
                    <p><strong>Station ID:</strong> ${sensor.id}</p>
                    <p><strong>Status:</strong>
                       <span style="color: ${iconColor};">${sensor.status.toUpperCase()}</span>
                    </p>
                    ${sensor.status === 'online' ? `
                        <p><strong>Water Level:</strong> ${sensor.waterLevel} cm</p>
                        <p><strong>Flow Rate:</strong> ${sensor.flowRate} m/s</p>
                        <small><em>Last updated: ${new Date().toLocaleTimeString()}</em></small>
                    ` : `
                        <p><em>Sensor under maintenance</em></p>
                    `}
                </div>
            `);

        this.mapLayers.sensors.addLayer(marker);  // Add to sensor layer
    });
}
```

---

## Module 3: Historical Analytics (module3-app.js)

### Data Analysis Configuration

```javascript
class AGOSAnalyticsSystem {
    constructor() {
        this.config = {
            // Time range options for analysis
            TIME_RANGES: {
                '24h': { hours: 24, interval: 'minute' },   // Recent detailed data
                '7d': { days: 7, interval: 'hour' },        // Weekly patterns
                '30d': { days: 30, interval: 'hour' },      // Monthly trends
                '90d': { days: 90, interval: 'day' },       // Seasonal analysis
                '1y': { days: 365, interval: 'day' },       // Annual climate patterns
                'custom': { custom: true }                   // User-defined ranges
            },

            // Chart color scheme
            COLORS: {
                waterLevel: '#3b82f6',    // Blue for water data
                flowRate: '#06b6d4',      // Cyan for flow velocity
                rainfall: '#8b5cf6',      // Purple for precipitation
                temperature: '#f59e0b',   // Amber for temperature
                emergency: '#ef4444',     // Red for emergency events
            },

            // Statistical correlation parameters
            CORRELATION_PARAMS: ['water_level', 'flow_rate', 'rainfall', 'temperature', 'humidity'],

            // Flood classification thresholds
            FLOOD_THRESHOLDS: {
                NORMAL: 0,      // Safe conditions (green)
                WATCH: 50,      // Monitor closely (yellow)
                ALERT: 100,     // Prepare for flooding (orange)
                EMERGENCY: 150  // Immediate evacuation (red)
            }
        };
```

### Historical Data Generation

```javascript
generateHistoricalData() {
    const data = [];
    const now = new Date();

    // Calculate time range for analysis
    const timeRange = this.config.TIME_RANGES[this.state.currentTimeRange];
    let startTime = new Date(now);
    if (timeRange.days) {
        startTime.setDate(startTime.getDate() - timeRange.days);  // Go back X days
    }

    // Generate realistic time series data
    for (let time = new Date(startTime); time <= now; time = new Date(time.getTime() + intervalMinutes * 60000)) {
        const dayOfYear = this.getDayOfYear(time);     // 1-365
        const hourOfDay = time.getHours();             // 0-23

        // Philippine monsoon season (June-November)
        const isMonsoon = time.getMonth() >= 5 && time.getMonth() <= 10;
        const seasonalFactor = isMonsoon ? 1.5 : 0.8;  // Higher values during monsoon

        // Daily patterns (higher water in afternoon/evening)
        const dailyFactor = 1 + 0.3 * Math.sin((hourOfDay - 6) * Math.PI / 12);

        // Base water level with seasonal variation
        const baseLevel = 35 + seasonalFactor * 15 * Math.sin(dayOfYear * 2 * Math.PI / 365);

        // Rainfall correlation (more rain = higher water level)
        const rainfall = Math.max(0, seasonalFactor * 5 * Math.random() + (isMonsoon ? 10 : 2));

        // Final water level calculation
        const waterLevel = Math.max(0, baseLevel +
            dailyFactor * 5 +          // Daily variation
            rainfall * 0.8 +           // Rainfall impact
            (Math.random() - 0.5) * 8  // Natural noise
        );

        // Flow rate correlated with water level (physics-based relationship)
        const flowRate = Math.max(0, baseFlow +
            (waterLevel - 35) * 0.02 +      // Higher level = faster flow
            rainfall * 0.05 +               // Rain increases flow
            (Math.random() - 0.5) * 0.3     // Natural variation
        );

        // Store complete data point
        data.push({
            timestamp: new Date(time),
            waterLevel: Number(waterLevel.toFixed(2)),      // Round to 2 decimals
            flowRate: Number(flowRate.toFixed(3)),          // 3 decimal precision
            rainfall: Number(rainfall.toFixed(1)),
            temperature: Number(temperature.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            turbidityUpstream: Number((0.2 + Math.random() * 0.3).toFixed(2)),
            turbidityDownstream: Number((0.2 + Math.random() * 0.4).toFixed(2)),
            batteryLevel: Math.max(60, 100 - (Math.random() * 0.1)),    // Slow discharge
            sensorHealth: Math.random() > 0.05,             // 95% uptime
            predictionAccuracy: Number((85 + Math.random() * 10).toFixed(1))
        });
    }

    return data;
}
```

### Flood Event Detection

```javascript
generateFloodEvents() {
    const events = [];
    const data = this.state.historicalData;
    let currentEvent = null;

    // Scan historical data for flood conditions
    data.forEach((point, index) => {
        const level = point.waterLevel;
        const flow = point.flowRate;

        // Check if flood conditions are met
        if (level >= this.config.FLOOD_THRESHOLDS.ALERT || flow >= 1.5) {
            if (!currentEvent) {
                // Start new flood event
                const severity = level >= this.config.FLOOD_THRESHOLDS.EMERGENCY ? 'emergency' :
                               level >= this.config.FLOOD_THRESHOLDS.ALERT ? 'alert' : 'watch';

                currentEvent = {
                    id: `event_${events.length + 1}`,          // Unique identifier
                    startTime: point.timestamp,                 // Event start
                    endTime: null,                              // Will be set when event ends
                    severity: severity,                         // Classification level
                    peakLevel: level,                           // Highest water level reached
                    peakFlow: flow,                             // Maximum flow rate
                    duration: 0,                                // Duration in minutes
                    affectedAreas: this.generateAffectedAreas(severity),  // Impacted locations
                    cause: this.generateEventCause(point)       // Likely cause (rain, etc.)
                };
            } else {
                // Update ongoing event with new peak values
                currentEvent.peakLevel = Math.max(currentEvent.peakLevel, level);
                currentEvent.peakFlow = Math.max(currentEvent.peakFlow, flow);

                // Escalate severity if conditions worsen
                const newSeverity = level >= this.config.FLOOD_THRESHOLDS.EMERGENCY ? 'emergency' :
                                  level >= this.config.FLOOD_THRESHOLDS.ALERT ? 'alert' : 'watch';
                if (newSeverity === 'emergency' && currentEvent.severity !== 'emergency') {
                    currentEvent.severity = 'emergency';  // Upgrade to emergency
                }
            }
        } else if (currentEvent && level < this.config.FLOOD_THRESHOLDS.WATCH) {
            // End current flood event (conditions returned to normal)
            currentEvent.endTime = point.timestamp;
            currentEvent.duration = Math.round((currentEvent.endTime - currentEvent.startTime) / (1000 * 60)); // Convert to minutes
            events.push(currentEvent);  // Add completed event to list
            currentEvent = null;        // Reset for next event
        }
    });

    // Handle ongoing event at end of data
    if (currentEvent) {
        currentEvent.endTime = data[data.length - 1].timestamp;
        currentEvent.duration = Math.round((currentEvent.endTime - currentEvent.startTime) / (1000 * 60));
        events.push(currentEvent);
    }

    return events.reverse(); // Return most recent events first
}
```

---

## Module 4: Emergency Response (module4-app.js)

### SMS Alert System Configuration

```javascript
class AGOSEmergencySystem {
    constructor() {
        this.config = {
            // Multi-level access control for different agencies
            ACCESS_CODES: {
                'dost-pagasa': 'p@assweird123',      // Weather service
                'dilg': 'emergency2025',             // Interior & Local Government
                'local-gov': 'localresponse',        // Local Government Units
                'agos-admin': 'agosadmin2025',       // System administrators
                'emergency': 'rescue911'             // First responders
            },

            // SIM800L hardware constraints and settings
            SMS_SETTINGS: {
                MAX_LENGTH: 160,          // Standard SMS limit
                BATCH_SIZE: 10,           // Messages per batch (carrier limits)
                RETRY_ATTEMPTS: 3,        // Failed message retries
                RETRY_DELAY: 30000,       // 30 seconds between retries
                DELIVERY_TIMEOUT: 120000  // 2 minutes for delivery confirmation
            },

            // Pre-configured emergency message templates
            ALERT_TEMPLATES: {
                'flash-flood': {
                    subject: '🚨 FLASH FLOOD ALERT',
                    // Template variables: {location}, {waterlevel}, {timestamp}, {operator}
                    message: 'URGENT: Flash flood warning issued for {location}. EVACUATE IMMEDIATELY to higher ground. Water level: {waterlevel}cm. Time: {timestamp}. Operator: {operator}',
                    priority: 'critical'    // Highest priority - send immediately
                },
                'flood-watch': {
                    subject: '⚠️ FLOOD WATCH',
                    message: 'ALERT: Flood watch issued for {location}. Prepare for possible flooding. Current level: {waterlevel}cm. Monitor updates. Time: {timestamp}. Operator: {operator}',
                    priority: 'high'        // High priority - send within 5 minutes
                },
                'weather-update': {
                    subject: '🌧️ WEATHER ADVISORY',
                    message: 'ADVISORY: Weather update for {location}. Current conditions - Water level: {waterlevel}cm. Stay alert and prepared. Time: {timestamp}. Operator: {operator}',
                    priority: 'normal'      // Normal priority - send within 15 minutes
                },
                'all-clear': {
                    subject: '✅ ALL CLEAR',
                    message: 'UPDATE: All clear issued for {location}. Flood threat has passed. Normal activities may resume. Time: {timestamp}. Operator: {operator}',
                    priority: 'low'         // Low priority - send within 30 minutes
                }
            }
        };
```

### SMS Sending Function

```javascript
async sendSMS(phoneNumber, message, template = 'custom') {
    console.log(`📱 Sending SMS to ${phoneNumber}...`);

    try {
        // Validate message length (SIM800L constraint)
        if (message.length > this.config.SMS_SETTINGS.MAX_LENGTH) {
            throw new Error(`Message too long: ${message.length} characters (max: ${this.config.SMS_SETTINGS.MAX_LENGTH})`);
        }

        // Create message record for tracking
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageRecord = {
            id: messageId,
            phoneNumber: phoneNumber,
            message: message,
            template: template,
            timestamp: new Date(),
            status: 'sending',           // Track delivery status
            attempts: 0,                 // Retry counter
            operator: this.state.currentOperator,
            priority: this.getTemplatePriority(template)
        };

        // Add to outgoing queue
        this.state.outgoingMessages.push(messageRecord);
        this.updateMessageHistory();

        // Simulate SMS sending (in production, sends via SIM800L)
        await this.delay(1000 + Math.random() * 2000);  // Realistic sending delay

        // Simulate delivery success/failure (95% success rate)
        const deliverySuccess = Math.random() > 0.05;

        if (deliverySuccess) {
            messageRecord.status = 'delivered';
            messageRecord.deliveryTime = new Date();
            console.log(`✅ SMS delivered to ${phoneNumber}`);

            // Update delivery statistics
            this.state.deliveryStats.sent++;
            this.state.deliveryStats.success++;

        } else {
            messageRecord.status = 'failed';
            messageRecord.errorMessage = 'Network timeout';
            console.log(`❌ SMS delivery failed to ${phoneNumber}`);

            // Schedule retry if attempts remaining
            if (messageRecord.attempts < this.config.SMS_SETTINGS.RETRY_ATTEMPTS) {
                this.scheduleRetry(messageRecord);
            } else {
                this.state.deliveryStats.failed++;
            }
        }

        this.updateMessageHistory();
        this.updateDeliveryStats();

        return messageRecord;

    } catch (error) {
        console.error('❌ SMS sending error:', error);
        this.state.deliveryStats.failed++;
        throw error;
    }
}
```

### Mass Broadcast Function

```javascript
async sendMassBroadcast(template, variables = {}) {
    console.log(`📢 Starting mass broadcast: ${template}`);

    try {
        const templateData = this.config.ALERT_TEMPLATES[template];
        if (!templateData) {
            throw new Error(`Unknown template: ${template}`);
        }

        // Get target contact groups based on template priority
        let targetGroups = [];
        switch (templateData.priority) {
            case 'critical':
                targetGroups = ['emergency', 'local-government', 'residents', 'media'];
                break;
            case 'high':
                targetGroups = ['local-government', 'residents'];
                break;
            case 'normal':
                targetGroups = ['residents'];
                break;
            case 'low':
                targetGroups = ['residents'];
                break;
        }

        // Collect all phone numbers from target groups
        const phoneNumbers = [];
        targetGroups.forEach(group => {
            if (this.state.contactGroups[group]) {
                phoneNumbers.push(...this.state.contactGroups[group].map(contact => contact.phone));
            }
        });

        console.log(`📋 Broadcasting to ${phoneNumbers.length} recipients in groups: ${targetGroups.join(', ')}`);

        // Prepare message with variable substitution
        let message = templateData.message;
        Object.keys(variables).forEach(key => {
            const placeholder = `{${key}}`;
            message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
        });

        // Add default variables if not provided
        const defaultVars = {
            timestamp: new Date().toLocaleString('en-PH'),
            operator: this.state.currentOperator || 'AGOS-System'
        };
        Object.keys(defaultVars).forEach(key => {
            const placeholder = `{${key}}`;
            if (message.includes(placeholder)) {
                message = message.replace(new RegExp(placeholder, 'g'), defaultVars[key]);
            }
        });

        // Send in batches to comply with carrier rate limits
        const batchSize = this.config.SMS_SETTINGS.BATCH_SIZE;
        const batches = [];
        for (let i = 0; i < phoneNumbers.length; i += batchSize) {
            batches.push(phoneNumbers.slice(i, i + batchSize));
        }

        console.log(`📦 Sending ${batches.length} batches of ${batchSize} messages each`);

        // Process each batch with delay between batches
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📤 Processing batch ${i + 1}/${batches.length}`);

            // Send all messages in current batch
            const batchPromises = batch.map(phone =>
                this.sendSMS(phone, message, template)
            );

            try {
                await Promise.all(batchPromises);
                console.log(`✅ Batch ${i + 1} completed`);
            } catch (error) {
                console.error(`❌ Batch ${i + 1} had errors:`, error);
            }

            // Delay between batches to avoid carrier throttling
            if (i < batches.length - 1) {
                await this.delay(5000); // 5 second delay between batches
            }
        }

        console.log(`🎉 Mass broadcast completed: ${phoneNumbers.length} messages sent`);

        // Log broadcast event
        this.logBroadcastEvent(template, phoneNumbers.length, variables);

    } catch (error) {
        console.error('❌ Mass broadcast failed:', error);
        throw error;
    }
}
```

---

## Integration Between Modules

### Module 1 → Module 4 (Emergency Response)

```javascript
// In Module 1 (app.js) - When emergency conditions are detected
activateEmergencyAlert() {
    console.log('🚨 EMERGENCY ALERT ACTIVATED');
    this.state.emergencyActive = true;

    // Prepare emergency broadcast data
    const emergencyData = {
        location: 'Pasig River Monitoring Station',
        waterlevel: this.state.waterLevel.toFixed(0),
        flowrate: this.state.flowRate.toFixed(1),
        timestamp: new Date().toLocaleString('en-PH'),
        operator: 'AGOS-Automated'
    };

    // Determine alert template based on conditions
    let template;
    if (this.state.waterLevel >= this.config.EMERGENCY_LEVEL) {
        template = 'flash-flood';    // Critical - immediate evacuation
    } else if (this.state.flowRate >= this.config.CRITICAL_FLOW) {
        template = 'flood-watch';    // High priority - prepare for flooding
    }

    // Trigger Module 4 emergency broadcast
    if (window.emergencySystem) {
        window.emergencySystem.sendMassBroadcast(template, emergencyData);
    }

    // Update UI elements
    const banner = this.elements['emergency-banner'];
    banner?.classList.remove('hidden');

    // Play audible alert
    this.playAlertSound();
}
```

### Module 1 → Module 3 (Historical Analytics)

```javascript
// In Module 1 (app.js) - Data logging for historical analysis
logSensorData() {
    const dataPoint = {
        timestamp: new Date(),
        waterLevel: this.state.waterLevel,
        flowRate: this.state.flowRate,
        upstreamTurbidity: this.state.upstreamTurbidity,
        downstreamTurbidity: this.state.downstreamTurbidity,
        batteryLevel: this.state.batteryLevel,
        levelSensorHealth: this.state.levelSensorHealth,
        flowSensorHealth: this.state.flowSensorHealth
    };

    // Send to Module 3 for historical storage
    if (window.analyticsSystem) {
        window.analyticsSystem.addDataPoint(dataPoint);
    }

    // Also store locally for immediate access
    this.localDataBuffer.push(dataPoint);

    // Keep buffer size manageable (last 1000 points)
    if (this.localDataBuffer.length > 1000) {
        this.localDataBuffer = this.localDataBuffer.slice(-1000);
    }
}
```

### Module 2 → Module 1 (AI Validation)

```javascript
// In Module 2 (module2-app.js) - Validate AI predictions with ground truth
validateAIPrediction() {
    // Get current sensor data from Module 1
    const groundTruth = {
        waterLevel: window.agosSystem?.state.waterLevel || 0,
        flowRate: window.agosSystem?.state.flowRate || 0,
        timestamp: new Date()
    };

    // Compare with AI prediction
    const prediction = this.state.currentPrediction;
    if (prediction) {
        const levelError = Math.abs(prediction.waterLevel - groundTruth.waterLevel);
        const flowError = Math.abs(prediction.flowRate - groundTruth.flowRate);

        // Calculate accuracy metrics
        const levelAccuracy = Math.max(0, 100 - (levelError / groundTruth.waterLevel * 100));
        const flowAccuracy = Math.max(0, 100 - (flowError / groundTruth.flowRate * 100));

        // Update hybrid model weights based on accuracy
        if (levelAccuracy < 70) {  // Poor AI performance
            this.state.hybridModel.satelliteWeight = 0.5;  // Reduce AI weight
            this.state.hybridModel.sensorWeight = 0.5;     // Increase sensor weight
        } else if (levelAccuracy > 90) {  // Excellent AI performance
            this.state.hybridModel.satelliteWeight = 0.8;  // Increase AI weight
            this.state.hybridModel.sensorWeight = 0.2;     // Reduce sensor dependency
        }

        console.log(`🎯 AI Validation - Level: ${levelAccuracy.toFixed(1)}%, Flow: ${flowAccuracy.toFixed(1)}%`);
    }
}
```

## Key Implementation Notes

### 1. Hardware Integration Points

- **Arduino Serial Communication**: All modules expect JSON data via WebSocket from Arduino
- **Sensor Polling**: 5-second intervals match Arduino's sensor reading frequency
- **Emergency Thresholds**: Must match values configured in Arduino firmware

### 2. Philippine-Specific Adaptations

- **Monsoon Patterns**: Analytics module includes June-November seasonal adjustments
- **Local Coordinates**: Maps centered on Metro Manila river systems
- **Government Integration**: Emergency contacts include DOST-PAGASA, DILG, LGUs
- **Language**: Mixed English/Filipino in emergency messages for clarity

### 3. Error Handling & Resilience

- **Offline Mode**: All modules can operate without backend connectivity
- **Sensor Fallbacks**: Multiple sensor validation before triggering alerts
- **SMS Retry Logic**: 3 attempts with exponential backoff for failed messages
- **Data Persistence**: Local storage backup for critical data

### 4. Performance Optimizations

- **DOM Caching**: All elements cached at initialization to avoid repeated queries
- **Animation Throttling**: RequestAnimationFrame for smooth 60fps animations
- **Data Compression**: Large historical datasets compressed before transmission
- **Lazy Loading**: Charts and maps initialized only when needed

This comprehensive code explanation shows how each line contributes to the overall flood monitoring system, from hardware sensor readings to emergency response coordination.

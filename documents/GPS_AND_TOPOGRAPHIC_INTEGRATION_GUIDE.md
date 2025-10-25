# 🗺️ AGOS GPS & Topographic Integration Guide

## Palawan Flood Monitoring System

---

## 📋 TABLE OF CONTENTS

1. [Hardware Setup](#hardware-setup)
2. [Topographic Data Download](#topographic-data-download)
3. [Data Processing](#data-processing)
4. [Server API Setup](#server-api-setup)
5. [Module 2 Frontend Updates](#module-2-frontend-updates)
6. [Offline Cache Implementation](#offline-cache-implementation)
7. [Testing & Deployment](#testing--deployment)

---

## 🔧 HARDWARE SETUP

### NEO-6M GPS Module Wiring

```
NEO-6M GPS Module    →    Arduino UNO R4 WiFi
─────────────────────────────────────────────
VCC (Red)            →    5V
GND (Black)          →    GND
TX (Yellow)          →    Pin 4 (RX)
RX (Green)           →    Pin 5 (TX)
```

### Important Notes:

- ✅ **GPS Antenna**: Module has ceramic antenna built-in
- ✅ **First Fix**: Takes 1-2 minutes outdoors (30 seconds on subsequent starts)
- ✅ **Best Signal**: Place near window or outdoors with clear sky view
- ✅ **LED Indicator**: Blinking = searching, Solid = GPS fix acquired

### Water Level Sensors (Existing)

- Sensor 1: A0 + Pin 9 (10" Half-knee)
- Sensor 2: A1 + Pin 10 (19" Knee)
- Sensor 3: A3 + Pin 13 (37" Waist)

---

## 📥 TOPOGRAPHIC DATA DOWNLOAD

### Option 1: Download from ArcGIS Web Application (RECOMMENDED)

**Access the Philippine Topographic Database:**

1. Open: https://www-uni.maps.arcgis.com/apps/webappviewer/index.html?id=a88b9ca0919f4400881eab4a26370cee

2. **Filter for Palawan Region:**

   - In the web app, use the search/filter tool
   - Search for "Palawan" or zoom to Palawan Island
   - Look for river catchments in your specific deployment area

3. **Download Shapefiles:**

   - Click on the catchment boundary
   - Select "Download" or "Export" option
   - Choose format: **Shapefile (.shp)** or **GeoJSON**
   - Download both:
     - River catchment boundaries
     - Stream networks
     - Elevation contours (if available)

4. **Key Palawan River Basins to Download:**
   - **Northern Palawan**: Tabon River, Ulugan Bay catchments
   - **Central Palawan**: Iwahig River, Puerto Princesa watershed
   - **Southern Palawan**: Brooke's Point, Bataraza catchments

### Option 2: Download Supporting Datasets

**Direct Download Link (from the research paper):**

- The paper mentions supporting datasets include:
  1. GIS shapefiles with river catchment properties
  2. GIS shapefiles with stream network properties
  3. Spreadsheets with morphometric data (91 characteristics)
  4. Example MATLAB code

**Expected Files:**

```
downloaded_topographic_data/
├── palawan_catchments.shp       (River catchment boundaries)
├── palawan_catchments.shx
├── palawan_catchments.dbf
├── palawan_catchments.prj
├── palawan_streams.shp          (Stream networks)
├── palawan_streams.shx
├── palawan_streams.dbf
├── palawan_streams.prj
├── elevation_contours.shp       (Elevation lines)
└── morphometric_data.xlsx       (Catchment characteristics)
```

---

## 🔄 DATA PROCESSING

### Step 1: Install QGIS (Free GIS Software)

Download from: https://qgis.org/en/site/forusers/download.html

### Step 2: Convert Shapefiles to GeoJSON

**Using QGIS:**

1. Open QGIS Desktop
2. Drag downloaded `.shp` file into QGIS
3. Right-click layer → Export → Save Features As
4. Format: **GeoJSON**
5. CRS: **EPSG:4326 (WGS 84)** ← Important for web maps!
6. Save to: `c:\Users\effie\Desktop\agos\public\maps\`

**Using Command Line (ogr2ogr):**

```bash
# Convert catchments
ogr2ogr -f GeoJSON -t_srs EPSG:4326 palawan_catchments.geojson palawan_catchments.shp

# Convert streams
ogr2ogr -f GeoJSON -t_srs EPSG:4326 palawan_streams.geojson palawan_streams.shp

# Convert elevation (simplify to reduce file size)
ogr2ogr -f GeoJSON -t_srs EPSG:4326 -simplify 0.001 palawan_elevation.geojson elevation_contours.shp
```

### Step 3: Optimize GeoJSON for Web

**Reduce File Size (using mapshaper.org):**

1. Go to: https://mapshaper.org
2. Upload your `.geojson` file
3. Click "Simplify" → Use 10-20% simplification
4. Export → Format: GeoJSON
5. Save optimized file

**Expected File Sizes:**

- Catchments: ~500KB - 2MB (optimized)
- Streams: ~1MB - 5MB (optimized)
- Elevation: ~2MB - 10MB (optimized)

---

## 🖥️ SERVER API SETUP

### Create New API Endpoint for GPS Data

**File: `c:\Users\effie\Desktop\agos\server.js`**

Add this endpoint after existing `/api/arduino-data`:

```javascript
// ═══ GPS + SENSOR DATA ENDPOINT ═══
app.post("/api/arduino-gps-data", express.json(), (req, res) => {
  const {
    latitude,
    longitude,
    altitude,
    satellites,
    hdop,
    gpsValid,
    waterLevel,
    sensor1,
    sensor2,
    sensor3,
    batteryLevel,
    timestamp,
  } = req.body;

  console.log("📍 Arduino GPS Data received:", {
    location: `${latitude}, ${longitude}`,
    altitude: `${altitude}m`,
    satellites,
    waterLevel,
    gpsValid,
  });

  // Store in database
  const query = `
    INSERT INTO gps_locations (
      latitude, longitude, altitude, satellites, hdop, gps_valid,
      water_level, sensor1, sensor2, sensor3, battery_level, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      latitude,
      longitude,
      altitude,
      satellites,
      hdop,
      gpsValid ? 1 : 0,
      waterLevel,
      sensor1,
      sensor2,
      sensor3,
      batteryLevel,
      timestamp,
    ],
    function (err) {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("✅ GPS data stored with ID:", this.lastID);

      // Broadcast to WebSocket clients (for real-time Module 2 map updates)
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "gps-update",
              data: {
                latitude,
                longitude,
                altitude,
                satellites,
                hdop,
                gpsValid,
                waterLevel,
                batteryLevel,
                timestamp,
              },
            })
          );
        }
      });

      res.json({
        success: true,
        message: "GPS data received",
        id: this.lastID,
      });
    }
  );
});

// ═══ GET LATEST GPS LOCATION ═══
app.get("/api/latest-gps", (req, res) => {
  const query = `
    SELECT * FROM gps_locations
    ORDER BY timestamp DESC
    LIMIT 1
  `;

  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ error: "No GPS data available" });
    }

    res.json({
      success: true,
      data: row,
    });
  });
});

// ═══ GET GPS HISTORY (for path tracking) ═══
app.get("/api/gps-history", (req, res) => {
  const limit = req.query.limit || 100;

  const query = `
    SELECT * FROM gps_locations
    WHERE gps_valid = 1
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  });
});
```

### Create GPS Database Table

**File: `c:\Users\effie\Desktop\agos\server.js`**

Add this table creation in the database initialization section:

```javascript
// Create GPS locations table
db.run(
  `
  CREATE TABLE IF NOT EXISTS gps_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL,
    satellites INTEGER,
    hdop REAL,
    gps_valid INTEGER,
    water_level INTEGER,
    sensor1 INTEGER,
    sensor2 INTEGER,
    sensor3 INTEGER,
    battery_level INTEGER,
    timestamp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`,
  (err) => {
    if (err) {
      console.error("❌ Error creating gps_locations table:", err);
    } else {
      console.log("✅ Table gps_locations created/verified");
    }
  }
);

// Create index for faster queries
db.run(`
  CREATE INDEX IF NOT EXISTS idx_gps_timestamp
  ON gps_locations(timestamp DESC)
`);
```

---

## 🗺️ MODULE 2 FRONTEND UPDATES

### Update module2-app.js

**Add GPS marker and topographic layers:**

```javascript
// Add to AGOSMappingSystem constructor
this.state = {
  // ... existing state

  // GPS Tracking
  arduinoLocation: null,
  gpsMarker: null,
  gpsPath: [],

  // Topographic Layers
  topoLayersLoaded: false,
  showTopography: true, // Default to true
  showSatellite: false, // Default to false (user can toggle)
};

this.mapLayers = {
  satellite: null,
  floodRisk: null,
  sensors: null,

  // NEW layers
  topoCatchments: null,
  topoStreams: null,
  topoElevation: null,
  gpsPath: null,
};
```

**Add GPS WebSocket Listener:**

```javascript
// In connectWebSocket() method, add:
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "gps-update") {
    this.handleGPSUpdate(message.data);
  }

  // ... existing message handlers
});
```

**Add GPS Update Handler:**

```javascript
handleGPSUpdate(gpsData) {
  console.log("📍 GPS Update received:", gpsData);

  if (!gpsData.gpsValid) {
    console.log("⚠️ GPS data not valid yet");
    return;
  }

  const { latitude, longitude, waterLevel, altitude } = gpsData;

  // Update Arduino location marker
  if (!this.state.gpsMarker) {
    // Create marker first time
    this.state.gpsMarker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'arduino-gps-marker',
        html: `
          <div class="gps-marker-container">
            <div class="gps-marker-icon">📍</div>
            <div class="gps-marker-label">Arduino R4 WiFi</div>
          </div>
        `,
        iconSize: [40, 40]
      })
    }).addTo(this.state.map);

    // Add popup
    this.state.gpsMarker.bindPopup(`
      <div class="gps-popup">
        <h3>🛰️ AGOS Monitor Station</h3>
        <p><strong>Coordinates:</strong><br>
           ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
        <p><strong>Altitude:</strong> ${altitude.toFixed(1)}m</p>
        <p><strong>Water Level:</strong> ${waterLevel}/3</p>
        <p><strong>Satellites:</strong> ${gpsData.satellites}</p>
      </div>
    `);

    // Center map on Arduino location
    this.state.map.setView([latitude, longitude], 14);

  } else {
    // Update existing marker position
    this.state.gpsMarker.setLatLng([latitude, longitude]);
    this.state.gpsMarker.getPopup().setContent(`
      <div class="gps-popup">
        <h3>🛰️ AGOS Monitor Station</h3>
        <p><strong>Coordinates:</strong><br>
           ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
        <p><strong>Altitude:</strong> ${altitude.toFixed(1)}m</p>
        <p><strong>Water Level:</strong> ${waterLevel}/3</p>
        <p><strong>Satellites:</strong> ${gpsData.satellites}</p>
      </div>
    `);
  }

  // Add to GPS path
  this.state.gpsPath.push([latitude, longitude]);

  // Draw GPS path (breadcrumb trail)
  if (this.mapLayers.gpsPath) {
    this.mapLayers.gpsPath.setLatLngs(this.state.gpsPath);
  } else {
    this.mapLayers.gpsPath = L.polyline(this.state.gpsPath, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 10'
    }).addTo(this.state.map);
  }

  // Calculate and show flood coverage based on water level + topography
  this.calculateFloodExtent(latitude, longitude, waterLevel, altitude);
}
```

**Load Topographic Layers:**

```javascript
async loadTopographicLayers() {
  console.log("🗺️ Loading Palawan topographic data...");

  try {
    // Load catchments
    const catchmentsResponse = await fetch('/maps/palawan_catchments.geojson');
    const catchmentsData = await catchmentsResponse.json();

    this.mapLayers.topoCatchments = L.geoJSON(catchmentsData, {
      style: {
        color: '#8B4513',
        weight: 2,
        fillColor: '#D2B48C',
        fillOpacity: 0.2
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindPopup(`
            <strong>Catchment:</strong> ${feature.properties.name || 'Unknown'}<br>
            <strong>Area:</strong> ${feature.properties.area || 'N/A'} km²<br>
            <strong>Slope:</strong> ${feature.properties.slope || 'N/A'}°
          `);
        }
      }
    });

    // Load streams
    const streamsResponse = await fetch('/maps/palawan_streams.geojson');
    const streamsData = await streamsResponse.json();

    this.mapLayers.topoStreams = L.geoJSON(streamsData, {
      style: {
        color: '#4169E1',
        weight: 2,
        opacity: 0.7
      }
    });

    // Load elevation contours
    const elevationResponse = await fetch('/maps/palawan_elevation.geojson');
    const elevationData = await elevationResponse.json();

    this.mapLayers.topoElevation = L.geoJSON(elevationData, {
      style: (feature) => {
        const elevation = feature.properties.elevation || 0;
        return {
          color: this.getElevationColor(elevation),
          weight: 1,
          opacity: 0.5
        };
      }
    });

    // Add to map if topography is enabled
    if (this.state.showTopography) {
      this.mapLayers.topoCatchments.addTo(this.state.map);
      this.mapLayers.topoStreams.addTo(this.state.map);
      this.mapLayers.topoElevation.addTo(this.state.map);
    }

    this.state.topoLayersLoaded = true;
    console.log("✅ Topographic layers loaded successfully");

  } catch (error) {
    console.error("❌ Error loading topographic data:", error);
  }
}

getElevationColor(elevation) {
  if (elevation < 50) return '#90EE90';   // Light green (lowland)
  if (elevation < 100) return '#FFD700';  // Gold
  if (elevation < 200) return '#FFA500';  // Orange
  if (elevation < 500) return '#8B4513';  // Brown
  return '#696969';                       // Dark gray (highland)
}
```

**Add Layer Toggle Controls:**

```javascript
setupLayerControls() {
  // Add to initializeControls() method

  const topoToggle = document.getElementById('toggle-topography');
  const satelliteToggle = document.getElementById('toggle-satellite');

  if (topoToggle) {
    topoToggle.addEventListener('change', (e) => {
      this.state.showTopography = e.target.checked;
      this.updateMapLayers();
    });
  }

  if (satelliteToggle) {
    satelliteToggle.addEventListener('change', (e) => {
      this.state.showSatellite = e.target.checked;
      this.updateMapLayers();
    });
  }
}

updateMapLayers() {
  // Toggle topographic layers
  if (this.state.showTopography && this.state.topoLayersLoaded) {
    this.mapLayers.topoCatchments?.addTo(this.state.map);
    this.mapLayers.topoStreams?.addTo(this.state.map);
    this.mapLayers.topoElevation?.addTo(this.state.map);
  } else {
    this.mapLayers.topoCatchments?.remove();
    this.mapLayers.topoStreams?.remove();
    this.mapLayers.topoElevation?.remove();
  }

  // Toggle satellite layer
  if (this.state.showSatellite) {
    this.mapLayers.satellite?.addTo(this.state.map);
  } else {
    this.mapLayers.satellite?.remove();
  }
}
```

---

## 💾 OFFLINE CACHE IMPLEMENTATION

### Service Worker for Offline Maps

**Create file: `c:\Users\effie\Desktop\agos\public\service-worker.js`**

```javascript
const CACHE_NAME = "agos-maps-v1";
const TOPOGRAPHIC_FILES = [
  "/maps/palawan_catchments.geojson",
  "/maps/palawan_streams.geojson",
  "/maps/palawan_elevation.geojson",
  "/module_2/module2.html",
  "/module_2/module2-app.js",
  "/module_2/module2-styles.css",
];

// Install service worker and cache topographic files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📥 Caching topographic data for offline use");
      return cache.addAll(TOPOGRAPHIC_FILES);
    })
  );
});

// Fetch from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        console.log("📦 Serving from cache:", event.request.url);
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

**Register Service Worker in module2.html:**

```html
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) =>
        console.log("✅ Service Worker registered for offline maps")
      )
      .catch((err) =>
        console.error("❌ Service Worker registration failed:", err)
      );
  }
</script>
```

---

## 🧪 TESTING & DEPLOYMENT

### Testing Checklist

**GPS Module Test:**

- [ ] GPS LED blinking (searching for satellites)
- [ ] GPS LED solid (fix acquired)
- [ ] Serial Monitor shows coordinates
- [ ] Coordinates update every second
- [ ] At least 4 satellites visible

**Arduino Upload Test:**

1. Open Arduino IDE
2. Install **TinyGPSPlus** library (Tools → Manage Libraries)
3. Select Board: **Arduino UNO R4 WiFi**
4. Select Port: COM port of Arduino
5. Upload `agos_with_gps.ino`
6. Open Serial Monitor (115200 baud)
7. Verify GPS data reception

**Server Test:**

- [ ] Server receives POST to `/api/arduino-gps-data`
- [ ] GPS data stored in database
- [ ] WebSocket broadcasts GPS updates
- [ ] Module 2 receives GPS updates

**Map Test:**

- [ ] Map loads in Module 2
- [ ] Topographic layers display
- [ ] Arduino marker appears at GPS coordinates
- [ ] Map auto-centers on Arduino location
- [ ] Layer toggle switches work
- [ ] Popup shows correct data

**Offline Test:**

1. Load Module 2 with internet
2. Disconnect internet
3. Refresh page
4. Verify topographic maps still load from cache

---

## 📍 EXPECTED COORDINATES FOR PALAWAN

**Major Cities/Towns:**

- **Puerto Princesa**: 9.7395°N, 118.7357°E
- **Coron**: 12.0085°N, 120.1997°E
- **El Nido**: 11.1947°N, 119.4057°E
- **Brooke's Point**: 8.7764°N, 117.8278°E

**Deployment Recommendation:**

- Test Arduino GPS in your specific deployment location
- Note the coordinates
- Adjust Module 2 map center to those coordinates

---

## ⚠️ TROUBLESHOOTING

**GPS Not Getting Fix:**

- Move Arduino near window or outdoors
- Wait 2-3 minutes for cold start
- Check antenna is not blocked
- Verify wiring (especially TX/RX crossover)

**Map Not Loading:**

- Check browser console for errors
- Verify GeoJSON files are in `/public/maps/` folder
- Confirm file paths in code match actual files

**Data Not Sending:**

- Check WiFi credentials in Arduino code
- Verify server IP address is correct
- Test with Postman: POST to `http://SERVER_IP:3000/api/arduino-gps-data`

**Offline Cache Not Working:**

- Clear browser cache and reload
- Check service worker registration in DevTools
- Verify service-worker.js is in `/public/` root

---

## 🚀 NEXT STEPS

1. **Download topographic data** from ArcGIS link above
2. **Convert to GeoJSON** using QGIS
3. **Place files** in `c:\Users\effie\Desktop\agos\public\maps\`
4. **Upload Arduino sketch** with GPS code
5. **Test GPS reception** (wait for fix)
6. **Update server.js** with new API endpoints
7. **Update module2-app.js** with GPS handlers
8. **Deploy and test** in Palawan!

---

## 📞 SUPPORT

If you encounter issues:

1. Check serial monitor for GPS status
2. Verify coordinates are within Palawan bounds
3. Test API endpoints with Postman
4. Check browser console for JavaScript errors

**Good luck with your deployment!** 🌊📡

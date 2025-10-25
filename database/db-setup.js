/**
 * AGOS Database Setup & Configuration
 * Professional SQLite database with comprehensive schema for flood monitoring
 * Author: AGOS Development Team
 * Date: 2025-10-19
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class AGOSDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, "agos_data.db");
    this.db = null;

    console.log("🗄️ AGOS Database System initializing...");
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("❌ Database connection failed:", err);
          return;
        }
        console.log("✅ Connected to AGOS SQLite database");
      });

      // Create all tables
      await this.createTables();

      console.log("🎉 AGOS Database initialized successfully!");
    } catch (error) {
      console.error("💥 Database initialization failed:", error);
    }
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 1. Sensor Data Table - Core real-time measurements
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            water_level REAL NOT NULL,
            flow_rate REAL NOT NULL,
            upstream_turbidity REAL NOT NULL,
            downstream_turbidity REAL NOT NULL,
            battery_level INTEGER NOT NULL,
            distance1 REAL,
            distance2 REAL,
            distance3 REAL,
            level_sensor_health BOOLEAN DEFAULT 1,
            flow_sensor_health BOOLEAN DEFAULT 1,
            alert_status TEXT DEFAULT 'NORMAL',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("sensor_data")
        );

        // 2. GPS Locations Table - Sensor deployment coordinates
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS gps_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id TEXT UNIQUE NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            altitude REAL,
            location_name TEXT,
            river_name TEXT,
            barangay TEXT,
            municipality TEXT,
            province TEXT,
            installation_date DATE,
            sensor_type TEXT DEFAULT 'ultrasonic',
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("gps_locations")
        );

        // 3. SMS Logs Table - Complete SMS communication history
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            alert_type TEXT NOT NULL,
            recipient_phone TEXT NOT NULL,
            message_content TEXT NOT NULL,
            operator_name TEXT,
            status TEXT DEFAULT 'pending',
            delivery_status TEXT,
            retry_count INTEGER DEFAULT 0,
            water_level_at_time REAL,
            flow_rate_at_time REAL,
            response_time_seconds REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("sms_logs")
        );

        // 4. Flood Events Table - Historical flood incidents
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS flood_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_start DATETIME NOT NULL,
            event_end DATETIME,
            severity TEXT NOT NULL,
            max_water_level REAL NOT NULL,
            max_flow_rate REAL NOT NULL,
            duration_minutes INTEGER,
            affected_areas TEXT,
            evacuation_triggered BOOLEAN DEFAULT 0,
            damage_assessment TEXT,
            weather_conditions TEXT,
            rainfall_mm REAL,
            event_description TEXT,
            resolved BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("flood_events")
        );

        // 5. System Logs Table - Technical system monitoring
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            log_level TEXT NOT NULL,
            component TEXT NOT NULL,
            message TEXT NOT NULL,
            error_details TEXT,
            user_action TEXT,
            ip_address TEXT,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("system_logs")
        );

        // 6. Arduino Calibration Table - Sensor calibration history
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS arduino_calibration (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            sensor_type TEXT NOT NULL,
            calibration_type TEXT NOT NULL,
            old_value REAL,
            new_value REAL,
            calibration_factor REAL,
            operator_name TEXT,
            notes TEXT,
            validation_reading REAL,
            success BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("arduino_calibration")
        );

        // 7. Weather Data Table - Environmental monitoring
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS weather_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            temperature REAL,
            humidity REAL,
            rainfall_mm REAL,
            wind_speed_kmh REAL,
            wind_direction TEXT,
            barometric_pressure REAL,
            weather_condition TEXT,
            data_source TEXT DEFAULT 'arduino',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("weather_data")
        );

        // 8. User Authentication Table - Security and access control
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'operator',
            full_name TEXT,
            email TEXT,
            phone_number TEXT,
            last_login DATETIME,
            login_attempts INTEGER DEFAULT 0,
            account_locked BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          this.logTableCreation("users")
        );

        // Create indexes for better query performance
        this.createIndexes();

        resolve();
      });
    });
  }

  createIndexes() {
    console.log("🔍 Creating database indexes for optimal performance...");

    // Sensor data indexes
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(timestamp)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sensor_alert_status ON sensor_data(alert_status)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sensor_water_level ON sensor_data(water_level)`
    );

    // GPS locations indexes
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_gps_coordinates ON gps_locations(latitude, longitude)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_gps_status ON gps_locations(status)`
    );

    // SMS logs indexes
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sms_timestamp ON sms_logs(timestamp)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sms_recipient ON sms_logs(recipient_phone)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_logs(status)`
    );

    // Flood events indexes
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_flood_start ON flood_events(event_start)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_flood_severity ON flood_events(severity)`
    );

    // System logs indexes
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_system_timestamp ON system_logs(timestamp)`
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_system_level ON system_logs(log_level)`
    );

    console.log("✅ Database indexes created successfully");
  }

  logTableCreation(tableName) {
    return (err) => {
      if (err) {
        console.error(`❌ Error creating table ${tableName}:`, err);
      } else {
        console.log(`✅ Table ${tableName} created/verified`);
      }
    };
  }

  // Sensor Data Operations
  async insertSensorData(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sensor_data (
          water_level, flow_rate, upstream_turbidity, downstream_turbidity,
          battery_level, distance1, distance2, distance3,
          level_sensor_health, flow_sensor_health, alert_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          data.waterLevel || 0,
          data.flowRate || 0,
          data.upstreamTurbidity || 0,
          data.downstreamTurbidity || 0,
          data.batteryLevel || 85,
          data.distance1 || 0,
          data.distance2 || 0,
          data.distance3 || 0,
          data.levelSensorHealth ? 1 : 0,
          data.flowSensorHealth ? 1 : 0,
          data.alertStatus || "NORMAL",
        ],
        function (err) {
          if (err) {
            console.error("❌ Error inserting sensor data:", err);
            reject(err);
          } else {
            console.log(`✅ Sensor data inserted with ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getRecentSensorData(hours = 24, limit = 1000) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM sensor_data
        WHERE timestamp >= datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // GPS Operations
  async insertGPSLocation(locationData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO gps_locations (
          sensor_id, latitude, longitude, altitude, location_name,
          river_name, barangay, municipality, province, sensor_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          locationData.sensorId,
          locationData.latitude,
          locationData.longitude,
          locationData.altitude || null,
          locationData.locationName || "",
          locationData.riverName || "",
          locationData.barangay || "",
          locationData.municipality || "",
          locationData.province || "Bulacan",
          locationData.sensorType || "ultrasonic",
          locationData.status || "active",
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getAllGPSLocations() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM gps_locations WHERE status = "active"',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // SMS Logging
  async logSMS(smsData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sms_logs (
          alert_type, recipient_phone, message_content, operator_name,
          status, water_level_at_time, flow_rate_at_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          smsData.alertType,
          smsData.recipientPhone,
          smsData.messageContent,
          smsData.operatorName || "system",
          smsData.status || "sent",
          smsData.waterLevel || 0,
          smsData.flowRate || 0,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // System Logging
  async logSystemEvent(level, component, message, details = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO system_logs (log_level, component, message, error_details)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(query, [level, component, message, details], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Flood Event Tracking
  async createFloodEvent(eventData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO flood_events (
          event_start, severity, max_water_level, max_flow_rate,
          affected_areas, weather_conditions, event_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          eventData.eventStart || new Date().toISOString(),
          eventData.severity,
          eventData.maxWaterLevel,
          eventData.maxFlowRate,
          eventData.affectedAreas || "",
          eventData.weatherConditions || "",
          eventData.description || "",
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("❌ Error closing database:", err);
        } else {
          console.log("✅ Database connection closed");
        }
      });
    }
  }
}

module.exports = AGOSDatabase;

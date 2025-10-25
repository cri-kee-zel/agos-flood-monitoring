# 📱 AGOS SMS ALERT SYSTEM - Complete Integration Guide

## 🎯 Overview

This system integrates **Arduino R4 WiFi + SIM800L** with **AGOS Module 4** to provide:

- ✅ **Automatic SMS alerts** based on water level sensors
- ✅ **Manual SMS broadcasts** from web dashboard
- ✅ **Multi-recipient management** via web interface
- ✅ **Real-time status monitoring**

---

## 🔌 Hardware Setup

### **Components:**

1. **Arduino UNO R4 WiFi**
2. **SIM800L GSM Module**
3. **3x Water Level Sensors** (TSOP38238 + IR LED)

### **Wiring Diagram:**

```
┌─────────────────────────────────────────────────────┐
│             ARDUINO R4 WIFI                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Pin 2  ──────► RX (SIM800L)                       │
│  Pin 3  ──────► TX (SIM800L)                       │
│  GND    ──────► GND (SIM800L)                      │
│                                                     │
│  A0     ──────► TSOP38238 (Sensor 1 - 10")        │
│  A1     ──────► TSOP38238 (Sensor 2 - 19")        │
│  A3     ──────► TSOP38238 (Sensor 3 - 37")        │
│                                                     │
│  Pin 9  ──────► IR LED 1 (via ULN2803)            │
│  Pin 10 ──────► IR LED 2 (via ULN2803)            │
│  Pin 13 ──────► IR LED 3 (via ULN2803)            │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               SIM800L MODULE                        │
├─────────────────────────────────────────────────────┤
│  VCC    ──────► 4.2V External Power Supply         │
│  GND    ──────► GND (Common Ground)                │
│  RX     ──────► Pin 2 (Arduino)                    │
│  TX     ──────► Pin 3 (Arduino)                    │
│  ANTENNA ─────► GSM Antenna (Required!)            │
└─────────────────────────────────────────────────────┘
```

### **⚠️ Critical Notes:**

1. **SIM800L Power:** Must use **4.2V external power**, NOT Arduino 5V!
2. **Antenna:** SIM800L requires antenna for network signal
3. **SIM Card:** Insert active SIM with credit before powering up
4. **Common Ground:** Arduino and SIM800L must share common GND

---

## 💻 Software Setup

### **1. Arduino Configuration**

Edit these lines in `agos_sms_integration.ino`:

```cpp
// WiFi Configuration (Lines 37-38)
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// AGOS Server Configuration (Lines 41-42)
const char* SERVER_HOST = "192.168.1.5";  // Your server IP
const int SERVER_PORT = 3000;
```

### **2. Upload to Arduino**

1. Open `agos_sms_integration.ino` in Arduino IDE
2. Select: **Tools → Board → Arduino UNO R4 WiFi**
3. Select: **Tools → Port → COMx** (your Arduino port)
4. Click **Upload** ⬆️

---

## 🌐 How It Works

### **System Architecture:**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│          WATER LEVEL SENSORS                         │
│         (TSOP38238 + IR LED)                        │
│                     │                                │
│                     ▼                                │
│         ┌─────────────────────┐                     │
│         │   ARDUINO R4 WIFI   │                     │
│         │  agos_sms_integration │                   │
│         └─────────────────────┘                     │
│              │           │                           │
│              │           │                           │
│         WiFi │           │ Serial                    │
│              │           │                           │
│              ▼           ▼                           │
│      ┌──────────┐   ┌──────────┐                   │
│      │  AGOS    │   │ SIM800L  │                   │
│      │  SERVER  │   │  MODULE  │                   │
│      │  :3000   │   │          │                   │
│      └──────────┘   └──────────┘                   │
│              │           │                           │
│              ▼           ▼                           │
│      ┌──────────┐   ┌──────────┐                   │
│      │ MODULE 4 │   │   SMS    │                   │
│      │Dashboard │   │ Network  │                   │
│      └──────────┘   └──────────┘                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### **Data Flow:**

#### **Automatic Alerts (Sensor-Triggered):**

```
1. Sensors detect water level
2. Arduino evaluates threshold:
   - 37" (Waist) → 🚨 Flash Flood Alert
   - 19" (Knee)  → ⚠️ Flood Watch
   - 10" (Half)  → ℹ️ Flood Advisory
   - 0"  (Dry)   → ✅ All Clear
3. Fetch recipients from server
4. Broadcast SMS via SIM800L
5. Report results to server
```

#### **Manual Alerts (Module 4 Button Press):**

```
1. User clicks alert button on Module 4
2. Module 4 sends POST to /api/send-sms
3. Server stores command in global state
4. Arduino polls /api/sms-command every loop
5. Arduino receives command
6. Fetch updated recipients
7. Broadcast SMS via SIM800L
8. Report results to server
```

---

## 🔧 API Endpoints

### **Arduino → Server:**

#### `POST /api/arduino-data`

Send sensor data every 5 seconds

```json
{
  "waterLevel": 19,
  "sensor1": true,
  "sensor2": true,
  "sensor3": false,
  "smsReady": true,
  "networkRegistered": true
}
```

#### `GET /api/sms-command`

Check for pending SMS commands from Module 4

```json
{
  "command": "send",
  "alertType": "flash-flood",
  "message": "🚨 FLASH FLOOD ALERT! Evacuate immediately!"
}
```

#### `GET /api/sms-recipients`

Fetch list of SMS recipients

```json
{
  "success": true,
  "recipients": ["+639691467590", "+639123456789"]
}
```

#### `POST /api/sms-status`

Report SMS broadcast results

```json
{
  "alertType": "flash-flood",
  "successCount": 15,
  "failedCount": 2,
  "timestamp": "1729412345"
}
```

### **Module 4 → Server:**

#### `POST /api/send-sms`

Trigger SMS broadcast from web dashboard

```json
{
  "alertType": "flash-flood",
  "operator": "Admin",
  "timestamp": "2025-10-20T10:30:00Z",
  "sensorData": {
    "waterLevel": 37,
    "flowRate": 0.5
  },
  "recipients": ["+639691467590"],
  "recipientCount": 1
}
```

#### `GET/POST/DELETE /api/sms-recipients`

Manage recipient list from web interface

---

## 🚨 Alert Messages

The system sends these pre-defined messages:

### **🌊 Flash Flood Alert (37" - Waist Deep)**

```
🚨 FLASH FLOOD ALERT! Water level: 37" (WAIST DEEP).
EVACUATE IMMEDIATELY! Stay safe. - AGOS
```

### **⚠️ Flood Watch (19" - Knee Deep)**

```
⚠️ FLOOD WATCH: Water level: 19" (KNEE DEEP).
Prepare to evacuate. Monitor updates. - AGOS
```

### **ℹ️ Flood Advisory (10" - Half-knee)**

```
ℹ️ FLOOD ADVISORY: Water level: 10" detected.
Stay alert and monitor conditions. - AGOS
```

### **✅ All Clear (0" - Dry)**

```
✅ ALL CLEAR: Water level has receded.
Threat passed. Stay vigilant. - AGOS
```

---

## ⚙️ Configuration

### **Alert Thresholds (Line 60-62):**

```cpp
const int FLASH_FLOOD_LEVEL = 37;   // Waist deep
const int FLOOD_WATCH_LEVEL = 19;   // Knee deep
const int FLOOD_ADVISORY_LEVEL = 10; // Half-knee
```

### **Alert Cooldown (Line 65):**

```cpp
const unsigned long ALERT_COOLDOWN = 300000; // 5 minutes
```

Prevents spam - only sends new alerts after 5 minutes

### **Max Recipients (Line 56):**

```cpp
const int MAX_RECIPIENTS = 50;
```

---

## 📱 Using Module 4 Dashboard

### **Access Module 4:**

1. Open browser: `http://localhost:3000/emergency`
2. Login credentials:
   - **Institution:** AGOS Administrator
   - **Operator ID:** admin
   - **Password:** agosadmin2025

### **Add Recipients:**

1. Enter phone number in international format: `+639171234567`
2. Click **➕ Add Recipient**
3. Recipient saved to `recipients.json`
4. Arduino auto-fetches updated list

### **Send Emergency Alert:**

1. Click one of 4 alert buttons:
   - 🚨 Flash Flood Alert (CRITICAL)
   - ⚠️ Flood Watch (WARNING)
   - 🌧️ Weather Update (INFO)
   - ✅ All Clear (NORMAL)
2. Message broadcasts to all recipients
3. Arduino receives command and sends SMS

---

## 🔍 Monitoring & Debugging

### **Arduino Serial Monitor (115200 baud):**

```
════════════════════════════════════════
  AGOS EMERGENCY SMS ALERT SYSTEM
  Arduino R4 WiFi + SIM800L
════════════════════════════════════════

🔧 Setting up water level sensors...
✅ Sensors configured

📡 Connecting to WiFi: MyWiFi
............
✅ WiFi Connected!
   IP Address: 192.168.1.100
   Signal Strength: -45 dBm

📱 Initializing SIM800L module...
1️⃣  Testing basic communication...
   ✅ Module responding
2️⃣  Checking SIM card...
   ✅ SIM card ready
3️⃣  Checking signal strength...
   📶 Signal: 18 - Good ✅
4️⃣  Registering to network...
   ✅ Network registered successfully!

📥 Fetching recipients from AGOS server...
✅ Recipients received
   Loaded 3 recipients

✅ System Ready!
════════════════════════════════════════
```

### **Common Issues:**

| Issue                          | Solution                                      |
| ------------------------------ | --------------------------------------------- |
| ❌ Module not responding       | Check power supply (4.2V), wiring             |
| ❌ SIM Card Issue              | Verify SIM inserted, has credit, PIN disabled |
| ❌ No Signal                   | Attach antenna, move to better location       |
| ❌ Network registration failed | Wait 2 minutes, check signal strength         |
| ❌ WiFi not connected          | Check SSID/password in code                   |
| ❌ No prompt received          | SIM800L not in text mode, restart module      |

---

## 🧪 Testing

### **Test 1: Manual SMS (Single Number)**

```cpp
// In Serial Monitor, run:
sendSMS("+639691467590", "Test from AGOS");
```

### **Test 2: Sensor Simulation**

```cpp
// Temporarily set in loop():
currentWaterLevel = 37; // Simulate waist-deep water
checkAutoAlerts();
```

### **Test 3: Module 4 Button**

1. Login to Module 4
2. Click "🚨 Flash Flood Alert"
3. Watch Arduino Serial Monitor
4. Check phone for SMS

---

## 📊 Network Status Indicators

### **Signal Strength (CSQ values):**

- **20-31:** Excellent ✅ (-51 to -53 dBm)
- **15-19:** Good ✅ (-73 to -75 dBm)
- **10-14:** Fair ⚠️ (-95 to -97 dBm)
- **5-9:** Poor ⚠️ (-109 to -111 dBm)
- **99:** No Signal ❌

### **Network Registration Status:**

- **+CREG: 0,1** - Registered (home network) ✅
- **+CREG: 0,5** - Registered (roaming) ✅
- **+CREG: 0,2** - Searching... ⏳
- **+CREG: 0,3** - Registration denied ❌
- **+CREG: 0,0** - Not registered ❌

---

## 🎯 Key Features

### ✅ **Automatic Alert System**

- Monitors water levels 24/7
- Sends alerts when thresholds crossed
- 5-minute cooldown prevents spam
- Auto-recovers from network issues

### ✅ **Web Dashboard Control**

- Add/remove recipients instantly
- Send emergency broadcasts
- Monitor system status
- View delivery reports

### ✅ **Sensor Priority Logic**

- Sensor 2 (19") most reliable
- Sensor 3 (37") requires validation
- Prevents false positives

### ✅ **Fault Tolerance**

- WiFi reconnection
- Network re-registration
- Retry failed SMS
- Offline recipient storage

---

## 📞 Default Recipient

If WiFi/server unavailable, uses default:

```cpp
recipients[0] = "+639691467590";
```

Change this to your emergency contact number!

---

## 🚀 Quick Start Checklist

- [ ] SIM800L connected with 4.2V power
- [ ] Antenna attached to SIM800L
- [ ] SIM card inserted with credit
- [ ] WiFi credentials updated in code
- [ ] Server IP configured in code
- [ ] Code uploaded to Arduino R4 WiFi
- [ ] Serial Monitor shows "✅ System Ready!"
- [ ] Module 4 accessible at localhost:3000/emergency
- [ ] Recipients added via Module 4 dashboard
- [ ] Test SMS sent successfully

---

## 🎓 Advanced Customization

### **Change Alert Messages:**

Edit lines 380-395 in `checkAutoAlerts()` function

### **Add More Alert Levels:**

```cpp
const int CRITICAL_LEVEL = 45;
// Add new threshold check in checkAutoAlerts()
```

### **Adjust Cooldown Time:**

```cpp
const unsigned long ALERT_COOLDOWN = 600000; // 10 minutes
```

### **Enable SMS Replies:**

Add in `loop()`:

```cpp
// Check for incoming SMS
if (sim800.available()) {
  String incoming = sim800.readString();
  if (incoming.indexOf("+CMT:") >= 0) {
    // Process incoming SMS
  }
}
```

---

## 📝 Code Structure

```
agos_sms_integration.ino
├── CONFIGURATION (Lines 33-74)
│   ├── WiFi settings
│   ├── Server settings
│   ├── Pin definitions
│   └── Alert thresholds
│
├── SETUP (Lines 76-104)
│   ├── Serial init
│   ├── Sensor setup
│   ├── WiFi connection
│   ├── SIM800L init
│   └── Fetch recipients
│
├── MAIN LOOP (Lines 106-125)
│   ├── Read sensors
│   ├── Check auto alerts
│   ├── Check server commands
│   └── Send sensor data
│
├── WIFI FUNCTIONS (Lines 127-165)
├── SENSOR FUNCTIONS (Lines 167-205)
├── SIM800L FUNCTIONS (Lines 207-335)
├── SMS SENDING FUNCTIONS (Lines 337-432)
├── AUTO ALERT FUNCTIONS (Lines 434-470)
└── SERVER COMMUNICATION (Lines 472-650)
```

---

## 💡 Tips & Best Practices

1. **Test in stages:** WiFi → Sensors → SIM800L → Integration
2. **Monitor signal:** Keep SIM800L in area with good signal (15+)
3. **Power stability:** Use regulated 4.2V supply for SIM800L
4. **Antenna placement:** Keep antenna away from metal objects
5. **Recipient limit:** Don't exceed 50 recipients (network limits)
6. **Message length:** Keep under 160 characters to avoid SMS splitting
7. **Cooldown time:** 5 minutes prevents alert fatigue
8. **Test numbers:** Use your own number for testing first

---

## 🆘 Support

**Serial Monitor Debugging:**

- Baud rate: 115200
- Look for: ✅ (success) or ❌ (error) symbols

**Network Issues:**

```cpp
// Add in setup() for detailed diagnostics:
checkSignalStrength();
```

**SMS Not Sending:**

1. Check signal strength (should be 10+)
2. Verify SIM card credit
3. Confirm number format: +[country][number]
4. Check prompt ">" appears before sending
5. Increase delays if network slow

---

## 🎉 You're Ready!

Your AGOS Emergency SMS Alert System is now fully integrated with:

- ✅ Arduino R4 WiFi sensor monitoring
- ✅ SIM800L SMS broadcasting
- ✅ Module 4 web dashboard control
- ✅ Automatic + Manual alerting

**Stay safe! 🌊🚨**

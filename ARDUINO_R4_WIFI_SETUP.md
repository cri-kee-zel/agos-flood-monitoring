# Arduino R4 WiFi Setup Guide for AGOS

## 📋 Overview

This guide will help you set up your Arduino R4 WiFi to connect to the AGOS server and send real-time sensor data to the Module 4 Serial Monitor.

---

## 🔧 Hardware Requirements

- **Arduino R4 WiFi** board
- **3x TSOP38238** IR receivers (for water level detection)
- **3x IR LEDs** (infrared emitters)
- **ULN2803** Darlington transistor array
- **Resistors** (220Ω for IR LEDs, 10kΩ pull-up for receivers)
- **100nF capacitors** for TSOP receivers
- **USB-C cable** for programming
- **WiFi network** with internet access

---

## 📦 Software Requirements

- **Arduino IDE 2.x** or newer
- **WiFiS3 Library** (pre-installed with Arduino R4 WiFi board package)

---

## ⚙️ Step 1: Install Arduino IDE

1. Download Arduino IDE from: https://www.arduino.cc/en/software
2. Install Arduino IDE 2.x or newer
3. Open Arduino IDE

---

## 📥 Step 2: Install Arduino R4 WiFi Board Support

1. Open Arduino IDE
2. Go to **Tools → Board → Boards Manager**
3. Search for **"Arduino UNO R4"**
4. Install **"Arduino UNO R4 Boards"** package
5. After installation, select:
   - **Tools → Board → Arduino UNO R4 WiFi**

---

## 🔌 Step 3: Hardware Wiring

### Power Connections

```
Arduino 5V  → Breadboard VCC rail (RED)
Arduino GND → Breadboard GND rail (BLACK)
```

### IR Receivers (TSOP38238)

```
Sensor 1 (10" - Half Knee):
- TSOP Pin 1 → VCC
- TSOP Pin 2 → GND
- TSOP Pin 3 → Arduino A0 + 10kΩ resistor to VCC
- 100nF capacitor between Pin 1 and GND

Sensor 2 (19" - Knee):
- TSOP Pin 1 → VCC
- TSOP Pin 2 → GND
- TSOP Pin 3 → Arduino A1 + 10kΩ resistor to VCC
- 100nF capacitor between Pin 1 and GND

Sensor 3 (37" - Waist):
- TSOP Pin 1 → VCC
- TSOP Pin 2 → GND
- TSOP Pin 3 → Arduino A2 + 10kΩ resistor to VCC
- 100nF capacitor between Pin 1 and GND
```

### IR LEDs with ULN2803

```
5V → 220Ω resistor → IR LED Anode (long leg)
IR LED Cathode (short leg) → ULN2803 Pin 18 (OUT1)

Arduino Pin 9  → ULN2803 Pin 1 (IN1) → Controls IR LED 1
Arduino Pin 10 → ULN2803 Pin 2 (IN2) → Controls IR LED 2
Arduino Pin 11 → ULN2803 Pin 3 (IN3) → Controls IR LED 3

ULN2803 Pin 9  → GND
ULN2803 Pin 10 → Leave OPEN
```

---

## 💻 Step 4: Configure Arduino Sketch

1. Open the file: `agosarduino/arduino_r4_wifi_agos.ino`

2. **Update WiFi credentials** (lines 16-17):

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

3. **Update Server IP address** (line 23):

```cpp
const char* SERVER_HOST = "192.168.1.100";  // Your computer's IP address
```

**To find your computer's IP address:**

- Open PowerShell
- Type: `ipconfig`
- Look for **"IPv4 Address"** under your WiFi/Ethernet adapter
- Example: `192.168.1.100`

4. **Adjust sensor calibration** (lines 48-50) after testing:

```cpp
SensorCalibration sensor1 = {300, 700}; // blocked, unblocked thresholds
SensorCalibration sensor2 = {300, 700};
SensorCalibration sensor3 = {300, 700};
```

---

## 📤 Step 5: Upload Sketch to Arduino

1. Connect Arduino R4 WiFi to your computer via USB-C cable
2. In Arduino IDE:
   - **Tools → Board** → Select **"Arduino UNO R4 WiFi"**
   - **Tools → Port** → Select the COM port (e.g., `COM3`, `COM5`)
3. Click **Upload** button (→) or press `Ctrl+U`
4. Wait for upload to complete

---

## 🚀 Step 6: Start AGOS Server

1. Open PowerShell in the AGOS folder:

```powershell
cd C:\Users\effie\OneDrive\Desktop\agos
```

2. Start the server:

```powershell
node server.js
```

3. You should see:

```
🚀 AGOS Server running on port 3000
📡 WebSocket server ready for connections
```

---

## 📡 Step 7: Monitor Arduino in Serial Monitor

1. In Arduino IDE, open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see Arduino connecting to WiFi and sending data:

```
╔════════════════════════════════════════╗
║   AGOS - Arduino R4 WiFi Starting     ║
║   Advanced Ground Observation System   ║
╚════════════════════════════════════════╝

✓ Hardware initialized
✓ Sensor pins configured

📡 Connecting to WiFi...
   SSID: YourWiFiName
...........
✅ WiFi connected!
   IP Address: 192.168.1.150
   Signal Strength: -45 dBm

🚀 System ready!
📡 Sending data to: http://192.168.1.100:3000/api/arduino-serial

📤 Sending data to server...
✅ Data sent successfully
   Water Level: 0.00 inches
   Sensors: S1=false S2=false S3=false
```

---

## 🖥️ Step 8: View Data in Module 4

1. Open browser and go to: `http://localhost:3000/emergency`
2. Login with credentials:
   - **Institution:** AGOS Administrator
   - **Operator ID:** admin
   - **Access Code:** agosadmin2025
3. Scroll down to **"Arduino Serial Data Monitor"** panel
4. You should see real-time data from Arduino:

```
[00:00:05.123] 📊 Water Level: 0.00" | Sensors: S1=○ S2=○ S3=○ | Signal: -45dBm
[00:00:10.456] 📊 Water Level: 0.00" | Sensors: S1=○ S2=○ S3=○ | Signal: -45dBm
[00:00:35.789] 💓 Heartbeat | Uptime: 35s | Signal: -45dBm
```

---

## 🔧 Arduino Serial Commands

Type these commands in the Arduino IDE Serial Monitor:

| Command     | Description                   |
| ----------- | ----------------------------- |
| `status`    | Display current system status |
| `test`      | Test all sensors              |
| `wifi`      | Show WiFi connection info     |
| `calibrate` | Run sensor calibration        |
| `reset`     | Restart Arduino               |
| `help`      | Show available commands       |

---

## 🐛 Troubleshooting

### Arduino won't connect to WiFi

1. Check SSID and password are correct
2. Ensure WiFi is 2.4GHz (R4 WiFi doesn't support 5GHz)
3. Check if WiFi network allows IoT devices
4. Try resetting Arduino with `reset` command

### Server not receiving data

1. Verify server IP address in Arduino code
2. Check firewall isn't blocking port 3000
3. Ensure server is running (`node server.js`)
4. Check Arduino Serial Monitor for error messages

### Sensors not detecting water

1. Run `calibrate` command to check sensor readings
2. Adjust `blockedThreshold` and `unblockedThreshold` values
3. Verify IR LED and receiver alignment (3.5mm gap)
4. Check wiring connections for loose wires

### Module 4 not showing Arduino data

1. Refresh browser page
2. Check browser console for errors (F12)
3. Verify WebSocket connection in Network tab
4. Ensure you're logged in to Module 4

---

## 📊 Sensor Calibration

1. Upload sketch and open Serial Monitor (115200 baud)
2. Type `calibrate` and press Enter
3. Note the readings when sensors are CLEAR (no water)
4. Block each sensor manually and note the readings
5. Update calibration values in code:

```cpp
// Example calibration:
// Clear reading: 850
// Blocked reading: 200
// Set threshold in middle: ~500

SensorCalibration sensor1 = {500, 850}; // blocked, unblocked
```

6. Re-upload sketch and test

---

## 🎯 Expected Behavior

### Water Level Detection

- **0 inches:** All sensors clear → No alert
- **10 inches (Half Knee):** Sensor 1 triggered → Flood Watch enabled
- **19 inches (Knee):** Sensors 1+2 triggered → Flash Flood alert
- **37 inches (Waist):** All sensors triggered → Critical emergency

### Data Flow

```
Arduino R4 WiFi
      ↓ (WiFi - HTTP POST)
AGOS Server (Node.js)
      ↓ (WebSocket)
Module 1 Dashboard (Water Level Display)
Module 4 Serial Monitor (Real-time Logs)
```

---

## 🔒 Security Notes

- Arduino sends data to local server only (no internet)
- Change default WiFi credentials after setup
- Use secure WiFi network (WPA2/WPA3)
- Server is accessible only on local network

---

## 📝 Next Steps

After successful setup:

1. Test each sensor by blocking IR beam with your hand
2. Verify water levels display correctly in Module 1
3. Check auto-SMS alerts trigger at correct thresholds
4. Deploy Arduino in actual flood monitoring location
5. Set up battery backup for Arduino (7.4V LiPo 2S)

---

## 💡 Tips

- Keep Arduino within WiFi range (< 30 meters from router)
- Use WiFi signal strength indicator in Serial Monitor
- Monitor uptime to detect resets/crashes
- Check Module 4 for error messages
- Use `status` command regularly to verify operation

---

## 📞 Support

If you encounter issues:

1. Check Arduino Serial Monitor for error messages
2. View Module 4 Serial Monitor for server logs
3. Check server console for connection errors
4. Verify all wiring connections are secure

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Compatible with:** Arduino R4 WiFi, AGOS Server v1.0.0

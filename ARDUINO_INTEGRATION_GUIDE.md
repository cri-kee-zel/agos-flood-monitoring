# AGOS Arduino WiFi Integration Guide

## 🎯 **SYSTEM READY FOR ARDUINO INTEGRATION**

Your AGOS system has been successfully configured to receive real sensor data from your Arduino UNO R4 WiFi!

## 📊 **Updated System Specifications**

### **Water Level Scale:**

- **Range**: 0 - 100cm (instead of 0-300cm)
- **Scale marks**: 0cm, 10cm, 20cm, 30cm, 40cm, 50cm, 60cm, 70cm, 80cm, 90cm, 100cm
- **Alert thresholds**:
  - **NORMAL**: 0-48cm (Green)
  - **WATCH**: 48-60cm (Yellow)
  - **ALERT**: 60-80cm (Orange)
  - **EMERGENCY**: 80-100cm (Red)

## 🔄 **Data Flow Architecture**

```
Arduino UNO R4 WiFi (115200 baud)
    ↓ WiFi HTTP POST
Server.js /api/arduino-data
    ↓ WebSocket broadcast
Frontend this.state.waterLevel
    ↓ JavaScript
updateWaterLevelDisplay()
    ↓ CSS Animation
#water-fill height (0-100%)
```

## 🔧 **Arduino Setup Instructions**

### **1. Install Required Libraries**

In Arduino IDE, go to **Tools > Manage Libraries** and install:

- `WiFiS3` (for Arduino UNO R4 WiFi connectivity)
- `ArduinoHttpClient` (for HTTP POST requests)
- `ArduinoJson` (for JSON data formatting)

### **2. Hardware Connections**

```
Arduino UNO R4 WiFi:
- Pin 2 → Ultrasonic Sensor TRIG
- Pin 3 → Ultrasonic Sensor ECHO
- 5V → Sensor VCC
- GND → Sensor GND
```

### **3. Configure WiFi Code**

1. Open `agos_wifi_example.ino`
2. Change these settings:

```cpp
const char* ssid = "YOUR_WIFI_NAME";        // Your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
const char* serverAddress = "192.168.1.XXX"; // Your computer's IP address
```

### **4. Find Your Computer's IP Address**

Run this in PowerShell:

```powershell
ipconfig | findstr IPv4
```

Use the IPv4 Address (e.g., `192.168.1.105`) in the Arduino code.

## 🚀 **Testing Steps**

### **1. Start AGOS Server**

```powershell
cd "C:\Users\effie\Desktop\agos"
node server.js
```

You should see:

```
🚀 AGOS Server running on port 3000
📡 WebSocket server ready for connections
```

### **2. Open Dashboard**

Visit: `http://localhost:3000/dashboard`

### **3. Upload Arduino Code**

1. Connect Arduino UNO R4 WiFi via USB
2. Select **Board**: Arduino UNO R4 WiFi
3. Upload `agos_wifi_example.ino`
4. Open Serial Monitor (115200 baud)

### **4. Verify Connection**

Arduino Serial Monitor should show:

```
✅ WiFi connected!
📡 IP address: 192.168.1.XXX
📤 Sending data - Distance: XX.X cm
✅ Data sent successfully!
```

Server console should show:

```
🤖 Arduino data received: { distance1: XX.X, timestamp: 'XXXX' }
📡 New WebSocket connection from: 127.0.0.1
```

## 🎨 **Visual Features**

### **Real-time Water Level Display**

- **Blue water fill** animation that rises/falls with sensor readings
- **Animated water surface** with realistic wave effects
- **Color-coded status** (Green/Yellow/Orange/Red)
- **Precise scale** with 10cm increments (0-100cm)

### **Emergency Alerts**

- **Red banner** appears when water ≥80cm
- **Pulsing animations** for immediate attention
- **Audio alerts** (browser permitting)

## ⚡ **Performance Features**

- **5-second updates** from Arduino to dashboard
- **Real-time WebSocket** communication
- **Automatic fallback** to simulated data if Arduino disconnects
- **Connection status** indicators
- **Error handling** and reconnection logic

## 🛠️ **Troubleshooting**

### **Arduino Not Connecting to WiFi**

```cpp
// Check these in your code:
const char* ssid = "EXACT_WIFI_NAME";     // Case sensitive!
const char* password = "EXACT_PASSWORD";   // Special characters OK
```

### **Server Not Receiving Data**

1. Check computer firewall settings
2. Ensure Arduino and computer are on same network
3. Verify IP address in Arduino code
4. Check server console for error messages

### **Dashboard Not Updating**

1. Refresh browser page
2. Check browser console (F12) for errors
3. Verify WebSocket connection status in dashboard header

## 📱 **Arduino Code Explained**

```cpp
// Your existing ultrasonic sensor function works perfectly:
float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.0343 / 2;
  return distance;
}

// New WiFi integration sends data to server:
void sendDataToServer(float distance) {
  StaticJsonDocument<200> doc;
  doc["distance1"] = distance;  // This becomes waterLevel in dashboard
  doc["timestamp"] = millis();

  // HTTP POST to /api/arduino-data
  client.post("/api/arduino-data");
  client.sendHeader("Content-Type", "application/json");
  // ... rest of HTTP request
}
```

## ✅ **System Status**

- ✅ **Simulation disabled** - Only real sensor data
- ✅ **Arduino endpoint** ready at `/api/arduino-data`
- ✅ **WebSocket broadcasting** implemented
- ✅ **Water scale updated** to 0-100cm range
- ✅ **Alert thresholds** adjusted for new scale
- ✅ **Visual improvements** with 10cm increment scale

Your AGOS flood monitoring system is now ready for real Arduino integration! 🌊📊

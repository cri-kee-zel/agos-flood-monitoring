# Arduino R4 WiFi - Quick Start Card

## 🔧 Configuration (Must Change)

```cpp
// Line 16-17: WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Line 23: Server IP (Find with: ipconfig in PowerShell)
const char* SERVER_HOST = "192.168.1.100";  // Your computer's IP
```

## 📤 Upload to Arduino

1. **Tools → Board → Arduino UNO R4 WiFi**
2. **Tools → Port → COM port** (e.g., COM3)
3. **Click Upload (→)** or press `Ctrl+U`

## 📊 Monitor Data

### Arduino Serial Monitor (115200 baud)

```
✅ WiFi connected!
   IP Address: 192.168.1.150
📤 Sending data to server...
✅ Data sent successfully
```

### Module 4 Serial Monitor

1. Go to: `http://localhost:3000/emergency`
2. Login: **admin** / **agosadmin2025**
3. View **"Arduino Serial Data Monitor"** panel

## 🎮 Serial Commands

| Command     | Action             |
| ----------- | ------------------ |
| `status`    | Show system status |
| `test`      | Test all sensors   |
| `wifi`      | WiFi info          |
| `calibrate` | Sensor calibration |
| `reset`     | Restart Arduino    |
| `help`      | Show commands      |

## 🌊 Water Levels

- **0"** = Clear (○ ○ ○)
- **10"** = Half Knee - Flood Watch (● ○ ○)
- **19"** = Knee - Flash Flood (● ● ○)
- **37"** = Waist - Critical (● ● ●)

## 📡 Data Flow

```
Arduino R4 WiFi
    ↓ (WiFi HTTP POST every 5s)
Server :3000
    ↓ (WebSocket)
Module 1 & Module 4
```

## 🐛 Troubleshooting

**WiFi won't connect:**

- Check SSID/password
- Use 2.4GHz WiFi (not 5GHz)
- Reset Arduino with `reset` command

**No data in Module 4:**

- Check server is running: `node server.js`
- Verify server IP in Arduino code
- Check firewall settings

**Sensors not working:**

- Run `calibrate` command
- Adjust thresholds in code
- Check IR LED/receiver alignment

## 📝 File Location

**Arduino Sketch:**
`agosarduino/arduino_r4_wifi_agos.ino`

**Full Guide:**
`ARDUINO_R4_WIFI_SETUP.md`

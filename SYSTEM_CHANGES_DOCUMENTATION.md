# AGOS Flood Monitoring System - Changes Documentation

**Date:** October 3, 2025
**Author:** System Documentation
**Version:** 2.0 - SMS Alert Integration

## 📋 Overview

This document outlines the comprehensive changes made to the AGOS (Automated Flood Monitoring and Alert System) to integrate SMS alert capabilities using the SIM800L v2 GSM module, along with enhanced multi-sensor support and real-time emergency response features.

---

## 🔧 Hardware Configuration Changes

### New Hardware Components Added:

- **SIM800L v2 GSM/GPRS Module** for SMS communication
- **Additional Ultrasonic Sensors** (Sensors 2 & 3) for upstream/downstream turbidity monitoring

### Pin Configuration:

```
Arduino UNO R4 WiFi Pin Assignments:
├── Sensor 1 (Water Level): Trig=D1, Echo=D2
├── Sensor 2 (Upstream Turbidity): Trig=D4, Echo=D6
├── Sensor 3 (Downstream Turbidity): Trig=D5, Echo=D7
└── SIM800L GSM Module: TXD=8, RXD=9, RST=3
```

---

## 📁 File Changes Summary

### 1. Arduino Code (`agosarduino/agosarduino.ino`)

**Major Changes:**

- ✅ **SIM800L Integration**: Complete GSM module support with SMS capabilities
- ✅ **Multi-Sensor Support**: 3 ultrasonic sensors for comprehensive monitoring
- ✅ **Flow Velocity Calculation**: Real-time flow rate calculation using turbidity differential
- ✅ **SMS Command Processing**: Receives SMS commands from web interface via server
- ✅ **Enhanced Data Structure**: Comprehensive sensor data storage for SMS alerts

**Key New Functions:**

```cpp
void initializeSIM800L()           // Initialize GSM module
void sendSMSAlert()               // Send SMS with sensor data
String createAlertMessage()       // Format alert messages
void checkForSMSCommands()        // Poll server for SMS commands
void processSMSCommand()          // Execute SMS alerts
```

**Network Configuration:**

```cpp
WiFi Networks Supported:
- PLDTHOMEFIBRcalcifer (Primary)
- PLDTHOMEFIBRhowl (Backup)
- WeWs (Alternative)
Server: 192.168.1.5:3000
```

### 2. Server Backend (`server.js`)

**Major Changes:**

- ✅ **SMS Command Endpoints**: `/api/send-sms` and `/api/sms-command`
- ✅ **Arduino Data Processing**: Enhanced data handling for 3-sensor input
- ✅ **WebSocket Broadcasting**: Real-time sensor data distribution
- ✅ **SMS Command Queue**: Server-side SMS command management

**New API Endpoints:**

```javascript
POST / api / send - sms; // Queue SMS command from web interface
GET / api / sms - command; // Polling endpoint for Arduino
POST / api / arduino - data; // Enhanced 3-sensor data processing
```

**Enhanced Data Structure:**

```json
{
  "waterLevel": "float (cm)",
  "flowRate": "float (m/s)",
  "upstreamTurbidity": "float (0-100)",
  "downstreamTurbidity": "float (0-100)",
  "distance1": "float (raw sensor 1)",
  "distance2": "float (raw sensor 2)",
  "distance3": "float (raw sensor 3)",
  "batteryLevel": "integer (%)",
  "timestamp": "string"
}
```

### 3. Module 4 Emergency Interface (`module_4/module4-app.js`)

**Complete Rewrite - File was completely reconstructed due to corruption**

**New Features:**

- ✅ **Real-time WebSocket Integration**: Live sensor data from Arduino
- ✅ **SMS Alert System**: 4 types of emergency alerts
- ✅ **Authentication System**: Secure operator access
- ✅ **Emergency Button Handlers**: Direct SMS triggering
- ✅ **Automatic Reconnection**: WebSocket connection management

**SMS Alert Types:**

```javascript
1. 🚨 CRITICAL ALERT   - Flash flood warning
2. ⚠️  WARNING ALERT   - Flood watch conditions
3. 📰 INFO ALERT       - Status update
4. ✅ ALL CLEAR        - Emergency resolved
```

**Authentication:**

```javascript
Access Codes:
- Institution: "agos-admin"
- Password: "agosadmin2025"
```

---

## 🔄 System Flow Integration

### SMS Alert Workflow:

```
1. Operator logs into Module 4
2. Real-time sensor data flows: Arduino → Server → Module 4
3. Emergency detected or operator triggers alert
4. Module 4 sends SMS command to server (/api/send-sms)
5. Server queues SMS command
6. Arduino polls server (/api/sms-command)
7. Arduino receives command and triggers SIM800L
8. SMS sent with current sensor data
```

### Data Flow Architecture:

```
Arduino (3 Sensors)
    ↓ WiFi
Server (WebSocket Hub)
    ↓ WebSocket
Module 1 (Dashboard) + Module 4 (Emergency)
    ↓ HTTP API
SMS Commands → Arduino → SIM800L → Mobile Network
```

---

## 📊 Enhanced Monitoring Capabilities

### Real-time Measurements:

- **Water Level**: Distance measurement in centimeters
- **Flow Velocity**: Calculated from turbidity differential (m/s)
- **Upstream Turbidity**: Normalized 0-100 scale
- **Downstream Turbidity**: Normalized 0-100 scale
- **Battery Level**: System power status
- **Alert Status**: NORMAL/ALERT/EMERGENCY

### Alert Thresholds:

```cpp
EMERGENCY: Water Level ≥ 80cm OR Flow Rate ≥ 1.2 m/s
ALERT:     Water Level ≥ 60cm OR Flow Rate ≥ 0.8 m/s
NORMAL:    Below alert thresholds
```

---

## 🚨 Emergency Response Features

### SMS Alert Content:

Each SMS includes:

- **Alert Type** with severity level
- **Current Water Level** (cm)
- **Flow Rate** (m/s)
- **Turbidity Readings** (upstream/downstream)
- **Battery Status** (%)
- **Alert Status** (NORMAL/ALERT/EMERGENCY)
- **Timestamp** and **Operator ID**

### Example SMS Format:

```
🌊 AGOS ALERT - FLASH FLOOD WARNING!
🚨 IMMEDIATE EVACUATION REQUIRED!

📊 CURRENT CONDITIONS:
💧 Water Level: 85.2 cm
🌊 Flow Rate: 1.45 m/s
⬆️ Upstream: 78.3
⬇️ Downstream: 82.1
🔋 Battery: 85%
⚠️ Status: EMERGENCY
🕒 Time: 1528s
```

---

## 🔧 Technical Improvements

### Arduino Enhancements:

- **Serial1 Communication**: Hardware serial for SIM800L (pins 8,9)
- **Float Calculations**: Manual normalization replacing map() function
- **Error Handling**: Comprehensive sensor validation
- **Connection Management**: WiFi auto-reconnection
- **Modular SMS Functions**: Reusable alert components

### Server Enhancements:

- **CORS Configuration**: Multi-origin support for development
- **JSON Validation**: Enhanced data validation
- **WebSocket Broadcasting**: Real-time data distribution
- **SMS Command Queue**: Async command processing
- **Security Headers**: Helmet.js integration

### Frontend Improvements:

- **WebSocket Auto-reconnection**: Resilient connection handling
- **Real-time UI Updates**: Live sensor data display
- **Authentication Security**: Secure operator access
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Mobile-friendly interface

---

## 🛠️ Deployment Configuration

### Network Requirements:

- **WiFi Network**: Stable internet connection for Arduino
- **Local Server**: Node.js server on port 3000
- **GSM Network**: Active SIM card for SMS functionality
- **Emergency Contact**: Configured phone number for alerts

### Dependencies:

```json
Node.js Packages:
- express: ^4.18.2
- ws: ^8.14.2
- cors: ^2.8.5
- helmet: ^7.1.0
- morgan: ^1.10.0
```

### Environment Setup:

```
Server IP: 192.168.1.5
Port: 3000
WebSocket: ws://192.168.1.5:3000
SMS Number: +639171234567 (configurable)
```

---

## 📋 Testing Checklist

### Arduino System:

- [x] SIM800L initialization and SMS sending
- [x] 3-sensor data collection and validation
- [x] WiFi connection and auto-reconnection
- [x] Server communication and data transmission
- [x] SMS command polling and processing

### Server System:

- [x] Arduino data reception and validation
- [x] WebSocket broadcasting to clients
- [x] SMS command endpoints functionality
- [x] CORS and security headers
- [x] Static file serving for all modules

### Module 4 Interface:

- [x] Authentication and access control
- [x] WebSocket connection and auto-reconnection
- [x] Real-time sensor data display
- [x] Emergency button SMS triggering
- [x] SMS command API integration

---

## 🚀 Future Enhancement Opportunities

### Potential Improvements:

1. **Database Integration**: Store sensor data and alert history
2. **Multi-Location Support**: Multiple Arduino stations
3. **Mobile App**: Dedicated mobile application for alerts
4. **AI Prediction**: Machine learning for flood prediction
5. **Backup Communications**: Multiple communication channels

### Scalability Considerations:

- **Load Balancing**: Multiple server instances
- **Data Analytics**: Historical data analysis
- **Geographic Expansion**: Multi-region deployment
- **Integration APIs**: Third-party service integration

---

## 📞 Emergency Contact Information

### System Administrators:

- **Primary Contact**: AGOS Technical Team
- **Emergency SMS**: +639171234567
- **System Access**: agos-admin credentials required

### Support Information:

- **Documentation**: Located in project root
- **GitHub Repository**: agos-flood-monitoring
- **Technical Support**: Available during business hours

---

**Document End - Version 2.0**
_Last Updated: October 3, 2025_

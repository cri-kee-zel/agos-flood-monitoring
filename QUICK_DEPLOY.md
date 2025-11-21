# 🚀 Quick Deploy to Digital Ocean - Arduino R4 WiFi Integration

## Server Information

- **IP**: 178.128.83.244
- **User**: agosadmin
- **Password**: 2000Rbbca12
- **Port**: 3000

---

## ⚡ ONE-COMMAND DEPLOYMENT

Open PowerShell and run:

```powershell
ssh agosadmin@178.128.83.244
```

Then on the server, run this single command:

```bash
cd ~/agos-flood-monitoring && git pull origin main && npm install --omit=dev && pm2 restart agos-server && pm2 logs agos-server --lines 20
```

---

## 📋 STEP-BY-STEP (If you prefer)

### 1. Connect to Server

```powershell
ssh agosadmin@178.128.83.244
# Password: 2000Rbbca12
```

### 2. Navigate to Project

```bash
cd ~/agos-flood-monitoring
```

### 3. Pull Latest Code

```bash
git pull origin main
```

### 4. Install Dependencies (if needed)

```bash
npm install --omit=dev
```

### 5. Restart Server

```bash
pm2 restart agos-server
```

### 6. Check Status

```bash
pm2 status
pm2 logs agos-server --lines 20
```

---

## ✅ VERIFY DEPLOYMENT

### Check from Browser:

1. **Main Page**: http://178.128.83.244:3000
2. **Emergency Panel**: http://178.128.83.244:3000/emergency
3. **Module 1**: http://178.128.83.244:3000/module_1

### Watch Server Logs:

```bash
pm2 logs agos-server --lines 50
```

You should see:

- `🚀 AGOS Server running on port 3000`
- `✅ WebSocket server is ready`
- Arduino polling: `GET /api/arduino-command`
- Arduino sending data: `POST /api/arduino-serial`

---

## 🔍 TROUBLESHOOTING

### If deployment fails:

```bash
# Check current status
pm2 status

# View error logs
pm2 logs agos-server --err

# Force restart
pm2 restart agos-server --force

# If still issues, delete and restart
pm2 delete agos-server
npm run pm2:start
```

### If git pull fails:

```bash
# Check what's changed
git status

# Force overwrite with GitHub version
git fetch origin
git reset --hard origin/main

# Try pull again
git pull origin main
```

### If Arduino can't connect:

1. Check Arduino is using correct IP: `178.128.83.244`
2. Check server is running: `pm2 status`
3. Check firewall: `sudo ufw status`
4. Test endpoint: `curl http://localhost:3000/api/arduino-command`

---

## 🎯 WHAT'S NEW IN THIS DEPLOYMENT

✅ Arduino R4 WiFi integration endpoints:

- `POST /api/arduino-serial` - Receives sensor data from Arduino
- `GET /api/arduino-command` - Sends commands to Arduino

✅ Two-way communication system:

- Arduino polls every 2 seconds for commands
- Web interface can send commands (sim10, demo, status, etc.)
- WebSocket broadcasts data to all connected clients

✅ Emergency panel features:

- Arduino Serial Data Monitor section
- Real-time command input
- Live sensor data display

---

## 📱 AFTER DEPLOYMENT

Your Arduino should now be able to:

1. ✅ Connect to Digital Ocean server at 178.128.83.244:3000
2. ✅ Send sensor data every 5 seconds
3. ✅ Poll for commands every 2 seconds
4. ✅ Execute commands from web interface
5. ✅ Display data on dashboard

**Test Commands from Web Interface:**

- Open: http://178.128.83.244:3000/emergency
- Scroll to "Arduino Serial Data Monitor"
- Type commands: `sim10`, `demo`, `status`, `help`
- Watch Arduino respond in real-time

---

## 🔗 IMPORTANT URLS

- **Dashboard**: http://178.128.83.244:3000/dashboard
- **Emergency Panel**: http://178.128.83.244:3000/emergency
- **Module 1 (Live Data)**: http://178.128.83.244:3000/module_1
- **Module 4 (SMS)**: http://178.128.83.244:3000/module_4

---

**Deployment Date**: November 20, 2025
**Features**: Arduino R4 WiFi Integration + Two-Way Communication

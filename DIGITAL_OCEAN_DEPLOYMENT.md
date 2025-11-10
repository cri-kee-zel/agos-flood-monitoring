# 🚀 AGOS v4.3 - Digital Ocean Deployment Guide

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Connect to Your Server](#connect-to-your-server)
3. [Update Code from GitHub](#update-code-from-github)
4. [Install Dependencies](#install-dependencies)
5. [Database Setup](#database-setup)
6. [Configure Environment](#configure-environment)
7. [Restart Services](#restart-services)
8. [Verify Deployment](#verify-deployment)
9. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES

Before deploying, ensure you have:

- ✅ Digital Ocean droplet running (Ubuntu/Linux)
- ✅ SSH access to your server
- ✅ Git installed on server
- ✅ Node.js installed on server
- ✅ PM2 process manager (recommended)
- ✅ Your server IP address
- ✅ GitHub repository access

---

## 🔐 CONNECT TO YOUR SERVER

### Option 1: Using PowerShell (Windows)

```powershell
# Replace with your actual server IP and username
ssh root@YOUR_SERVER_IP

# OR if you have a specific user
ssh your_username@YOUR_SERVER_IP
```

### Option 2: Using PuTTY (Windows)

1. Open PuTTY
2. Host Name: `YOUR_SERVER_IP`
3. Port: `22`
4. Connection Type: SSH
5. Click "Open"
6. Login with your credentials

### Option 3: Using VS Code Remote SSH

1. Install "Remote - SSH" extension
2. Press `Ctrl+Shift+P`
3. Type "Remote-SSH: Connect to Host"
4. Enter: `root@YOUR_SERVER_IP`

---

## 📥 UPDATE CODE FROM GITHUB

### Step 1: Navigate to Your AGOS Directory

```bash
# Navigate to where AGOS is installed
cd /var/www/agos
# OR
cd ~/agos-flood-monitoring
# OR wherever you cloned the repo
```

### Step 2: Check Current Status

```bash
# Check current branch and status
git status

# Check current version
git log --oneline -1
```

### Step 3: Pull Latest Changes from GitHub

```bash
# Fetch latest changes
git fetch origin

# Pull v4.3 from main branch
git pull origin main
```

**If you get merge conflicts:**

```bash
# Stash local changes
git stash

# Pull again
git pull origin main

# Reapply your local changes (if any)
git stash pop
```

### Step 4: Verify v4.3 Was Pulled

```bash
# Should show: "🚀 AGOS v4.3 - GPS Integration..."
git log --oneline -1
```

---

## 📦 INSTALL DEPENDENCIES

### Update Node.js Packages

```bash
# Install/update all dependencies
npm install

# If you get permission errors, use:
sudo npm install

# Clear cache if needed
npm cache clean --force
npm install
```

### Verify Package Installation

```bash
# Check installed packages
npm list --depth=0

# Should show:
# ├── express
# ├── ws (WebSocket)
# ├── sqlite3
# ├── body-parser
# └── other dependencies
```

---

## 💾 DATABASE SETUP

### Option 1: Automatic Setup (Database Exists)

If your database already exists, the server will automatically add the new GPS table:

```bash
# The server.js will create the GPS table on startup
# No manual action needed
```

### Option 2: Fresh Database Setup

If starting fresh or want to reset:

```bash
# Navigate to database directory
cd database

# Run database setup script
node db-setup.js

# Go back to main directory
cd ..
```

### Option 3: Manual Database Update

If you want to manually add GPS table:

```bash
# Install sqlite3 command-line tool
sudo apt-get install sqlite3

# Open database
sqlite3 database/agos.db

# Create GPS table
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
);

CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);

-- Exit sqlite3
.exit
```

---

## ⚙️ CONFIGURE ENVIRONMENT

### Check Port Configuration

Your server should be listening on port **3000** (or your configured port):

```bash
# Edit server.js if needed
nano server.js

# Look for:
# const PORT = process.env.PORT || 3000;
```

### Configure Firewall (if needed)

```bash
# Allow port 3000 through firewall
sudo ufw allow 3000/tcp

# Or if using different port
sudo ufw allow YOUR_PORT/tcp

# Check firewall status
sudo ufw status
```

### Set Up Environment Variables (if needed)

```bash
# Create .env file
nano .env

# Add configuration:
PORT=3000
NODE_ENV=production
DATABASE_PATH=./database/agos.db
```

---

## 🔄 RESTART SERVICES

### Option 1: Using PM2 (RECOMMENDED)

PM2 keeps your app running and restarts on crashes:

```bash
# If PM2 not installed
sudo npm install -g pm2

# Stop existing process
pm2 stop agos

# Start with new code
pm2 start server.js --name agos

# Or use ecosystem file if you have one
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup

# View logs
pm2 logs agos

# Check status
pm2 status
```

### Option 2: Using systemd Service

If you have AGOS as a systemd service:

```bash
# Restart service
sudo systemctl restart agos

# Check status
sudo systemctl status agos

# View logs
sudo journalctl -u agos -f
```

### Option 3: Manual Restart (Not Recommended for Production)

```bash
# Stop existing process (find PID first)
ps aux | grep node
kill -9 PID_NUMBER

# Start server
node server.js

# Or run in background with nohup
nohup node server.js > output.log 2>&1 &
```

---

## ✅ VERIFY DEPLOYMENT

### Step 1: Check Server is Running

```bash
# Using PM2
pm2 status

# Using curl to test locally
curl http://localhost:3000

# Should return the main page HTML
```

### Step 2: Check from Your Browser

Open in browser:

- **Main Page**: `http://YOUR_SERVER_IP:3000`
- **Module 1**: `http://YOUR_SERVER_IP:3000/module_1`
- **Module 2**: `http://YOUR_SERVER_IP:3000/module_2`
- **Module 3**: `http://YOUR_SERVER_IP:3000/module_3`
- **Module 4**: `http://YOUR_SERVER_IP:3000/module_4`

### Step 3: Test New GPS Endpoint

```bash
# Test GPS API endpoint (from your local computer)
curl -X POST http://YOUR_SERVER_IP:3000/api/arduino-gps-data \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 9.7395,
    "longitude": 118.7357,
    "altitude": 25.5,
    "satellites": 8,
    "hdop": 1.2,
    "gpsValid": true,
    "waterLevel": 0,
    "sensor1": 850,
    "sensor2": 820,
    "sensor3": 900,
    "batteryLevel": 95,
    "timestamp": "2025-10-25T10:30:00Z"
  }'

# Should return: {"success": true, "message": "GPS data received", "id": 1}
```

### Step 4: Check Arduino Connection

If your Arduino is trying to connect:

```bash
# Watch server logs for Arduino connections
pm2 logs agos --lines 50

# You should see:
# "📍 Arduino GPS Data received: {location: ...}"
```

### Step 5: Verify Module 4 Features

1. Navigate to Module 4: `http://YOUR_SERVER_IP:3000/module_4`
2. Check Arduino Monitor is visible
3. Test Emergency Alert buttons
4. Verify cooldown timer works
5. Test message customization

---

## 🔧 TROUBLESHOOTING

### Issue: "Permission Denied" when pulling from Git

```bash
# Check Git remote URL
git remote -v

# If using HTTPS and need authentication
git config credential.helper store
git pull origin main
# Enter GitHub username and personal access token

# OR switch to SSH (if you have SSH keys setup)
git remote set-url origin git@github.com:cri-kee-zel/agos-flood-monitoring.git
```

### Issue: "Port Already in Use"

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 PID_NUMBER

# Or use PM2 to restart
pm2 restart agos
```

### Issue: "Module Not Found" Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# If still issues, check Node.js version
node --version

# Should be v14 or higher
```

### Issue: Database Not Working

```bash
# Check database file exists
ls -la database/

# Check permissions
chmod 664 database/agos.db
chmod 755 database/

# Check database structure
sqlite3 database/agos.db ".tables"

# Should show: gps_locations, sensor_data, etc.
```

### Issue: PM2 Not Starting

```bash
# View detailed logs
pm2 logs agos --err

# Reset PM2
pm2 delete all
pm2 start server.js --name agos

# Check PM2 process list
pm2 list
```

### Issue: WebSocket Not Connecting

```bash
# Check if WebSocket port is open
sudo netstat -tulpn | grep :3000

# Ensure firewall allows WebSocket
sudo ufw allow 3000/tcp

# Check Nginx configuration if using reverse proxy
sudo nano /etc/nginx/sites-available/agos

# Add WebSocket upgrade headers:
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Arduino Can't Connect to Server

**From Arduino side:**

1. Check WiFi credentials in Arduino code
2. Update `SERVER_HOST` to your Digital Ocean IP
3. Verify server is accessible from Arduino's network
4. Test with: `http://YOUR_SERVER_IP:3000/api/arduino-gps-data`

**From Server side:**

```bash
# Check server logs
pm2 logs agos

# Test if endpoint is accessible
curl -X POST http://localhost:3000/api/arduino-gps-data \
  -H "Content-Type: application/json" \
  -d '{"latitude": 9.7395, "longitude": 118.7357}'
```

---

## 📊 MONITORING YOUR DEPLOYMENT

### View Real-Time Logs

```bash
# PM2 logs (live)
pm2 logs agos

# View last 100 lines
pm2 logs agos --lines 100

# Error logs only
pm2 logs agos --err
```

### Check Resource Usage

```bash
# PM2 monitoring
pm2 monit

# Server resources
htop
# or
top

# Disk usage
df -h

# Memory usage
free -m
```

### Set Up Log Rotation (Prevent Log Files from Growing Too Large)

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🔒 SECURITY RECOMMENDATIONS

### 1. Use Environment Variables for Sensitive Data

```bash
# Create .env file (not committed to Git)
nano .env

# Add:
PORT=3000
NODE_ENV=production
DATABASE_PATH=./database/agos.db
SECRET_KEY=your_secret_key_here

# Update server.js to use:
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### 2. Set Up HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate (if using domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 3. Configure Firewall

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

## 🎯 QUICK DEPLOYMENT COMMAND SUMMARY

**Complete deployment in one go:**

```bash
# 1. Navigate to directory
cd /var/www/agos

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Restart with PM2
pm2 restart agos

# 5. Check status
pm2 status
pm2 logs agos --lines 20
```

---

## 📞 POST-DEPLOYMENT CHECKLIST

- [ ] Server pulls v4.3 code successfully
- [ ] Dependencies installed without errors
- [ ] Database updated with GPS tables
- [ ] PM2 shows AGOS running
- [ ] Website loads in browser
- [ ] Module 4 features working (cooldown, messages, Arduino monitor)
- [ ] GPS API endpoint responds to test POST
- [ ] WebSocket connection established
- [ ] Arduino can send data to server (if connected)
- [ ] Logs show no critical errors

---

## 🆘 NEED HELP?

**Check these first:**

1. Server logs: `pm2 logs agos`
2. Browser console: F12 → Console tab
3. Arduino Serial Monitor: 115200 baud
4. Network connectivity: Can Arduino reach server IP?

**Common Commands:**

```bash
# Restart everything
pm2 restart agos

# View logs
pm2 logs agos

# Check status
pm2 status

# Monitor resources
pm2 monit

# Update from GitHub
git pull origin main && npm install && pm2 restart agos
```

---

## 🎉 SUCCESS!

If everything is working:

- ✅ v4.3 deployed to Digital Ocean
- ✅ GPS endpoints ready for Arduino
- ✅ Module 4 enhancements live
- ✅ System ready for Palawan deployment

**Next Steps:**

1. Update Arduino code with your server IP
2. Upload GPS-enabled sketch to Arduino
3. Test GPS data transmission
4. Download topographic data for Module 2
5. Deploy to field location

---

**Version**: AGOS v4.3
**Last Updated**: October 25, 2025
**Deployment Target**: Digital Ocean Ubuntu Server

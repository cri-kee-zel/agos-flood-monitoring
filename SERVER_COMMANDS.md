# AGOS Server Management Commands

## 🚀 Essential Commands Reference

### **Connect to Server**

```bash
ssh agosadmin@178.128.83.244
# Password: 2000Rbbca12
```

### **Navigate to Project**

```bash
cd ~/agos-flood-monitoring
```

---

## 🔄 **Update Commands (Most Common)**

### **Standard Update Process:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Restart application
pm2 restart agos-server

# 3. Check status
pm2 status
```

### **Update with New Dependencies:**

```bash
git pull origin main
npm install --omit=dev
pm2 restart agos-server
pm2 status
```

---

## 📊 **Monitoring Commands**

### **Check Application Status:**

```bash
# Process status
pm2 status

# Detailed info
pm2 show agos-server

# Real-time monitoring
pm2 monit
```

### **View Logs:**

```bash
# Recent logs (last 20 lines)
pm2 logs agos-server --lines 20

# Follow logs in real-time
pm2 logs agos-server

# Only error logs
pm2 logs agos-server --err
```

### **Health Checks:**

```bash
# Test API
curl http://localhost:3000/api/health

# Check port
sudo ss -tulpn | grep 3000

# Test dashboard
curl -I http://localhost:3000/dashboard
```

---

## 🛠️ **Management Commands**

### **PM2 Process Control:**

```bash
# Start application
pm2 start ecosystem.config.js
# or
npm run pm2:start

# Restart application
pm2 restart agos-server

# Stop application
pm2 stop agos-server

# Delete process (complete removal)
pm2 delete agos-server

# Reload application (zero-downtime)
pm2 reload agos-server
```

### **Environment Management:**

```bash
# View environment file
cat .env

# Edit environment file
nano .env

# Check environment variables
pm2 env 0
```

---

## 🔧 **Git Commands**

### **Basic Git Operations:**

```bash
# Check status
git status

# See what changed
git diff

# Pull latest changes
git pull origin main

# Check commit history
git log --oneline -10
```

### **Troubleshooting Git:**

```bash
# Force pull (overwrite local changes)
git fetch origin
git reset --hard origin/main

# Check remote URL
git remote -v

# Check current branch
git branch
```

---

## 🚨 **Emergency Commands**

### **If Application Won't Start:**

```bash
# Check what's using port 3000
sudo ss -tulpn | grep 3000

# Kill process on port 3000
sudo fuser -k 3000/tcp

# Start fresh
pm2 delete agos-server
npm run pm2:start
```

### **If Website Not Loading:**

```bash
# Check if server is running
pm2 status

# Check recent errors
pm2 logs agos-server --err --lines 10

# Restart everything
pm2 restart agos-server
```

### **If Git Pull Fails:**

```bash
# Check for conflicts
git status

# Force overwrite with latest
git fetch origin
git reset --hard origin/main

# If completely broken, re-clone
cd ~
mv agos-flood-monitoring agos-flood-monitoring-backup
git clone https://github.com/cri-kee-zel/agos-flood-monitoring.git
cd agos-flood-monitoring
cp ../agos-flood-monitoring-backup/.env .
npm install --omit=dev
npm run pm2:start
```

---

## 📈 **System Commands**

### **Server Resources:**

```bash
# Memory usage
free -h

# Disk space
df -h

# CPU usage
htop

# System load
uptime
```

### **Network:**

```bash
# Check firewall
sudo ufw status

# Check open ports
sudo ss -tulpn

# Test external access
curl -I http://178.128.83.244:3000/api/health
```

---

## 🎯 **Quick Troubleshooting**

### **Website Not Working:**

```bash
pm2 status                          # Check if running
pm2 logs agos-server --lines 10     # Check for errors
curl http://localhost:3000/api/health # Test locally
pm2 restart agos-server             # Restart if needed
```

### **Can't Connect to Server:**

```bash
# Try from local machine
ssh agosadmin@178.128.83.244

# If connection fails, check:
# - Internet connection
# - Server IP address
# - SSH service status
```

### **Application Errors:**

```bash
pm2 logs agos-server --err          # Check error logs
pm2 monit                           # Monitor resources
pm2 restart agos-server             # Try restart
```

---

## 📋 **Routine Maintenance**

### **Daily:**

```bash
pm2 status
```

### **Weekly:**

```bash
git pull origin main
pm2 restart agos-server
pm2 logs agos-server --lines 5
df -h
```

### **Monthly:**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean logs
pm2 flush

# Check disk space
df -h

# Restart server
sudo reboot
```

---

## 🔗 **Important URLs**

- **Main Site:** http://178.128.83.244:3000/
- **Dashboard:** http://178.128.83.244:3000/dashboard
- **API Health:** http://178.128.83.244:3000/api/health
- **GitHub:** https://github.com/cri-kee-zel/agos-flood-monitoring

---

## 💡 **Pro Tips**

1. **Always check logs after changes:** `pm2 logs agos-server`
2. **Test locally before deploying:** Visit health endpoint first
3. **Keep backups:** Copy `.env` before major changes
4. **Monitor resources:** Use `pm2 monit` for real-time stats
5. **Use descriptive commits:** Makes troubleshooting easier

---

## 🆘 **When All Else Fails**

```bash
# Nuclear option - complete restart
pm2 delete agos-server
cd ~
rm -rf agos-flood-monitoring
git clone https://github.com/cri-kee-zel/agos-flood-monitoring.git
cd agos-flood-monitoring
# Recreate .env file with correct values
npm install --omit=dev
npm run pm2:start
```

**Remember: Your data and configuration are in GitHub and `.env` - everything else can be rebuilt!**

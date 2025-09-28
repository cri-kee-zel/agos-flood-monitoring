# AGOS Deployment Update Guide

## 🚀 Quick Update Process for Live Server

This guide covers how to update your AGOS Flood Monitoring System when you make changes to your GitHub repository, without going through the full installation process again.

---

## 📋 **Prerequisites**

- ✅ AGOS system already deployed and running
- ✅ GitHub repository: `https://github.com/cri-kee-zel/agos-flood-monitoring`
- ✅ Server: `agosadmin@178.128.83.244`
- ✅ PM2 process manager configured

---

## 🔄 **Standard Update Workflow**

### **Step 1: Make Changes Locally**

**On your local machine (Windows PowerShell):**

```powershell
# Navigate to your project
cd "C:\Users\effie\Desktop\agos"

# Make your changes to files (HTML, CSS, JS, etc.)
# Edit files as needed...

# Check what you changed
git status
git diff

# Add changes to git
git add .

# Commit with descriptive message
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

### **Step 2: Update Server**

**SSH into your server:**

```bash
ssh agosadmin@178.128.83.244
```

**Update the server code:**

```bash
# Navigate to project directory
cd ~/agos-flood-monitoring

# Check current status
git status

# Pull latest changes from GitHub
git pull origin main

# If you updated dependencies in package.json, reinstall them
npm install --omit=dev

# Restart the application to apply changes
pm2 restart agos-server

# Verify it's running
pm2 status

# Check for any errors
pm2 logs agos-server --lines 10
```

### **Step 3: Test Changes**

Visit your website to verify changes:
- Main: `http://178.128.83.244:3000/`
- Dashboard: `http://178.128.83.244:3000/dashboard`
- Other modules as needed

---

## ⚡ **Quick Update Commands (Cheat Sheet)**

### **Local Machine (Windows PowerShell)**
```powershell
cd "C:\Users\effie\Desktop\agos"
git add .
git commit -m "Your update description"
git push origin main
```

### **Server (SSH Terminal)**
```bash
cd ~/agos-flood-monitoring
git pull origin main
pm2 restart agos-server
pm2 status
```

---

## 🛠️ **Advanced Update Scenarios**

### **When You Add New Dependencies**

If you add new packages to `package.json`:

```bash
# After git pull
npm install --omit=dev

# Restart PM2
pm2 restart agos-server
```

### **When You Update Environment Variables**

If you modify `.env` settings:

```bash
# Edit environment file
nano .env

# Make your changes, save (Ctrl+X, Y, Enter)

# Restart to apply new environment
pm2 restart agos-server
```

### **When You Update Server Configuration**

If you modify `server.js`, `ecosystem.config.js`, or other server files:

```bash
# After git pull
pm2 restart agos-server

# If PM2 configuration changed, reload
pm2 delete agos-server
npm run pm2:start
```

---

## 🔍 **Troubleshooting Commands**

### **Check Server Status**
```bash
# PM2 process status
pm2 status

# Detailed process info
pm2 show agos-server

# Real-time monitoring
pm2 monit
```

### **View Logs**
```bash
# Recent logs
pm2 logs agos-server --lines 20

# Follow logs in real-time
pm2 logs agos-server

# Error logs only
pm2 logs agos-server --err
```

### **Server Health Checks**
```bash
# Test API endpoint
curl http://localhost:3000/api/health

# Check port is listening
sudo ss -tulpn | grep 3000
```

### **Git Issues**
```bash
# Check git status
git status

# See what changed
git diff

# Force pull (if conflicts)
git fetch origin
git reset --hard origin/main
```

---

## 🚨 **Critical Things to Remember**

### **❌ DO NOT Do These:**
1. **Never delete the entire directory** - just use `git pull`
2. **Don't run full installation** - existing setup works
3. **Don't change .env production values** unless necessary
4. **Don't stop PM2** unless restarting

### **✅ Always Remember To:**
1. **Test locally first** before pushing to GitHub
2. **Use descriptive commit messages**
3. **Check PM2 status** after updates
4. **Verify website works** after each update
5. **Keep backups** of working .env file

---

## 📁 **File Update Guidelines**

### **Safe to Update Anytime:**
- `main/main.html`, `main/main-script.js`, `main/main-styles.css`
- `module_*/` files (HTML, CSS, JS)
- `README.md`, documentation files
- Static files in `public/`

### **Requires Restart:**
- `server.js` (restart PM2)
- `package.json` (reinstall dependencies + restart)
- `.env` files (restart PM2)

### **Requires Special Attention:**
- `ecosystem.config.js` (may need PM2 reload)
- Security configurations (test thoroughly)
- Database configurations (if added)

---

## 🔄 **Rollback Process (If Something Breaks)**

### **Quick Rollback:**
```bash
# Check recent commits
git log --oneline -5

# Rollback to previous commit (replace COMMIT_HASH)
git reset --hard COMMIT_HASH

# Restart application
pm2 restart agos-server
```

### **Emergency Restore:**
```bash
# If git is broken, re-clone
cd ~
rm -rf agos-flood-monitoring-backup
mv agos-flood-monitoring agos-flood-monitoring-backup
git clone https://github.com/cri-kee-zel/agos-flood-monitoring.git
cd agos-flood-monitoring

# Copy your .env file back
cp ../agos-flood-monitoring-backup/.env .

# Reinstall and restart
npm install --omit=dev
pm2 delete agos-server
npm run pm2:start
```

---

## 📊 **Monitoring Commands**

### **System Resources:**
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
htop
```

### **Application Monitoring:**
```bash
# PM2 monitoring dashboard
pm2 monit

# Server access logs
pm2 logs agos-server | grep "GET"

# Error monitoring
pm2 logs agos-server --err --lines 50
```

---

## 🎯 **Best Practices**

### **Development Workflow:**
1. Make changes locally
2. Test locally with `npm start`
3. Commit and push to GitHub
4. Update server with `git pull`
5. Restart PM2
6. Test live site

### **Commit Message Format:**
```bash
git commit -m "Add: new feature description"
git commit -m "Fix: bug description"
git commit -m "Update: component description"
git commit -m "Style: UI improvements"
```

### **Update Schedule:**
- **Small changes**: Update immediately
- **Major changes**: Test thoroughly first
- **Critical fixes**: Update and monitor closely
- **Regular maintenance**: Weekly/monthly updates

---

## 📞 **Emergency Contacts & Info**

### **Server Details:**
- **IP:** 178.128.83.244
- **User:** agosadmin
- **Password:** 2000Rbbca12
- **Port:** 3000

### **Key URLs:**
- **Main Site:** http://178.128.83.244:3000/
- **Health Check:** http://178.128.83.244:3000/api/health
- **GitHub:** https://github.com/cri-kee-zel/agos-flood-monitoring

### **Important Commands:**
```bash
# Quick status check
pm2 status && curl -s http://localhost:3000/api/health

# Full restart
pm2 restart agos-server && pm2 logs agos-server --lines 5

# Emergency stop/start
pm2 stop agos-server
pm2 start agos-server
```

---

## 🎉 **Summary**

**For 90% of updates, you only need these 4 commands:**

1. **Local:** `git add . && git commit -m "your message" && git push`
2. **Server:** `ssh agosadmin@178.128.83.244`
3. **Server:** `cd ~/agos-flood-monitoring && git pull origin main`
4. **Server:** `pm2 restart agos-server && pm2 status`

**Your AGOS system is now maintenance-ready!** 🚀
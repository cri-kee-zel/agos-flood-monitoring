# 🚀 AGOS Migration Guide: DigitalOcean → Heroku

## 📋 Table of Contents

1. [Should You Use Heroku?](#should-you-use-heroku)
2. [Heroku vs Alternative Options](#comparison)
3. [Pre-Migration Checklist](#pre-migration)
4. [Step-by-Step Heroku Deployment](#heroku-deployment)
5. [Critical Configuration Changes](#configuration)
6. [Post-Migration Testing](#testing)
7. [Cost Comparison](#cost)

---

## 🤔 Should You Use Heroku?

### ✅ **GOOD FIT for AGOS if:**

- ✅ You have GitHub Student Pack (FREE credits!)
- ✅ You want automatic deployments from GitHub
- ✅ You're comfortable with managed services
- ✅ Arduino sends data over internet (WiFi)
- ✅ You don't need SSH access to server
- ✅ Your traffic is moderate (not 24/7 heavy load)

### ❌ **NOT IDEAL for AGOS if:**

- ❌ Arduino connects via USB/Serial (needs local connection)
- ❌ You need root/SSH access for hardware debugging
- ❌ You want full control over server configuration
- ❌ Your database grows very large (>1GB)
- ❌ You need custom port configurations

---

## 📊 Heroku vs Alternative Options

| Feature                 | **Heroku**           | **Railway.app**       | **Render.com**  | **Fly.io**    | **DigitalOcean**  |
| ----------------------- | -------------------- | --------------------- | --------------- | ------------- | ----------------- |
| **Student Free Tier**   | ✅ $13/month credits | ❌ No student program | ✅ Free tier    | ✅ Free tier  | ❌ Paid only      |
| **GitHub Integration**  | ✅ Automatic         | ✅ Automatic          | ✅ Automatic    | ✅ Automatic  | ⚠️ Manual CI/CD   |
| **Easy Setup**          | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐            | ⭐⭐⭐⭐        | ⭐⭐⭐        | ⭐⭐              |
| **Database Included**   | ✅ PostgreSQL        | ✅ PostgreSQL         | ✅ PostgreSQL   | ✅ PostgreSQL | ❌ Self-managed   |
| **WebSocket Support**   | ✅ Yes               | ✅ Yes                | ✅ Yes          | ✅ Yes        | ✅ Yes            |
| **Custom Domains**      | ✅ Free              | ✅ Free               | ✅ Free         | ✅ Free       | ✅ Free           |
| **SSL Certificate**     | ✅ Auto              | ✅ Auto               | ✅ Auto         | ✅ Auto       | ⚠️ Manual         |
| **Sleep/Downtime**      | ⚠️ After 30 min      | ⚠️ After 10 min       | ⚠️ After 15 min | ❌ No sleep   | ❌ No sleep       |
| **Philippines Latency** | 🌏 ~150-250ms        | 🌏 ~150-250ms         | 🌏 ~150-200ms   | 🌏 ~100-150ms | 🌏 ~10-50ms (SGP) |
| **Student Support**     | ✅ Excellent         | ❌ Limited            | ✅ Good         | ✅ Good       | ⚠️ General        |

### 🏆 **My Recommendation for AGOS:**

**Best Option: Railway.app** or **Render.com**

- ✅ Free tier is generous (Railway: $5/month credit, Render: 750 hours/month)
- ✅ No sleep on paid plans
- ✅ Modern, fast deployment
- ✅ Better for real-time IoT applications
- ✅ Simpler than DigitalOcean

**Second Choice: Heroku** (with GitHub Student Pack)

- ✅ You get $13/month credits
- ✅ Most documentation available
- ⚠️ Eco dyno sleeps after 30 minutes
- ⚠️ Need to upgrade to Basic ($7/month) to avoid sleep

**For Production/Thesis: Keep DigitalOcean or Upgrade to VPS**

- If this is for thesis defense or continuous monitoring
- Consider: **Vultr**, **Linode**, or **AWS Lightsail** (~$5-10/month)
- Better for 24/7 real-time monitoring

---

## ⚠️ CRITICAL: AGOS-Specific Concerns

### 🔴 **Arduino Serial Communication Issue**

Your current setup likely uses:

```javascript
const { SerialPort } = require("serialport");
// This ONLY works on local servers with USB connection!
```

**Heroku/Cloud Solution:**

- Arduino must send data via HTTP/WebSocket over WiFi (which you already have!)
- Remove SerialPort dependency
- Use only `/api/arduino-data` endpoint

### 🔴 **SQLite Database Limitation**

Your current setup uses SQLite (`agos_data.db`):

```javascript
const AGOSDatabase = require("./database/db-setup");
```

**Heroku Issue:**

- Heroku has ephemeral filesystem (data resets on restart!)
- SQLite file will be deleted periodically

**Solutions:**

1. **Use Heroku Postgres** (recommended, free tier available)
2. **Use MongoDB Atlas** (free tier, cloud database)
3. **Use PostgreSQL on Railway/Render**

---

## 📝 Pre-Migration Checklist

- [ ] **Backup your DigitalOcean database**

  ```bash
  # On your DigitalOcean server
  cd /var/www/agos
  sqlite3 database/agos_data.db .dump > agos_backup.sql
  ```

- [ ] **Test Arduino WiFi Connection**

  ```cpp
  // Verify Arduino can send data over internet
  // Not just local network!
  ```

- [ ] **Export Recipients List**

  ```bash
  cp recipients.json recipients_backup.json
  ```

- [ ] **Document Current Configuration**

  - [ ] What's your current URL?
  - [ ] What's Arduino IP address?
  - [ ] Any custom environment variables?

- [ ] **Choose Database Migration Path**
  - [ ] SQLite → PostgreSQL (recommended)
  - [ ] SQLite → MongoDB Atlas
  - [ ] Keep SQLite with external storage

---

## 🚀 Step-by-Step: Heroku Deployment

### **Option A: Quick Deploy (No Database Migration)**

#### 1. **Install Heroku CLI**

```bash
# Windows (PowerShell as Administrator)
winget install Heroku.HerokuCLI

# Verify installation
heroku --version
```

#### 2. **Login to Heroku**

```bash
heroku login
# Opens browser for authentication
```

#### 3. **Create Heroku App**

```bash
cd C:\Users\effie\Desktop\agos

# Create new app (choose unique name)
heroku create agos-flood-monitoring

# Or let Heroku generate name
heroku create
```

#### 4. **Add GitHub Student Pack Credits**

- Go to: https://www.heroku.com/github-students/
- Click "Get Student Benefits"
- Verify with GitHub Student Pack
- You'll get $13/month credits

#### 5. **Configure Heroku for AGOS**

Create `Procfile` (tells Heroku how to run your app):

```bash
# I'll create this file for you in next step
```

#### 6. **Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
# Add any other variables from your .env
```

#### 7. **Deploy to Heroku**

```bash
# Add Heroku remote
heroku git:remote -a agos-flood-monitoring

# Push to Heroku
git push heroku main
```

#### 8. **Scale and Monitor**

```bash
# Ensure one dyno is running
heroku ps:scale web=1

# View logs
heroku logs --tail
```

#### 9. **Open Your App**

```bash
heroku open
```

---

### **Option B: Full Migration with PostgreSQL**

#### 1. **Install PostgreSQL Addon**

```bash
# Free tier: 10,000 rows, 1GB storage
heroku addons:create heroku-postgresql:essential-0

# Check database URL (auto-added to env vars)
heroku config:get DATABASE_URL
```

#### 2. **Migrate SQLite to PostgreSQL**

I'll need to create a migration script for you. The database structure needs to be converted.

#### 3. **Update Database Connection**

Modify `database/db-setup.js` to support PostgreSQL (I can help with this).

---

## 🔧 Critical Configuration Changes Needed

Let me create the necessary files for Heroku deployment:

### **Files I Need to Create:**

1. ✅ `Procfile` - Tells Heroku how to start app
2. ✅ `.slugignore` - Files to exclude from deployment
3. ✅ `heroku.yml` - Docker config (if using Docker)
4. ⚠️ Update `package.json` scripts
5. ⚠️ Modify database connection for PostgreSQL

---

## 💰 Cost Comparison (Monthly)

| Provider             | Free Tier          | Paid Tier           | Annual Cost       |
| -------------------- | ------------------ | ------------------- | ----------------- |
| **Heroku (Student)** | $13 credit/month   | Eco $5, Basic $7    | $0 (with credits) |
| **Railway.app**      | $5 credit/month    | $5+ usage           | $60+              |
| **Render.com**       | 750 hours free     | $7+                 | $84+              |
| **Fly.io**           | Free tier generous | $1.94+              | $23+              |
| **DigitalOcean**     | N/A                | $6 (1GB), $12 (2GB) | $72-144           |
| **Vultr**            | N/A                | $6 (1GB)            | $72               |

**For Students:** Heroku with GitHub Student Pack = **FREE** for 1 year!

---

## 🎯 My Recommended Action Plan

### **For Your Situation (October expiry):**

**Phase 1: Test Heroku (This Week)**

1. Deploy AGOS to Heroku with basic setup
2. Test if Arduino can connect over internet
3. Test WebSocket real-time updates
4. Verify SMS functionality works

**Phase 2: Database Migration (Next Week)**

1. If Heroku works, migrate to PostgreSQL
2. Import historical data
3. Update all database queries

**Phase 3: Production Cutover (Before Expiry)**

1. Update Arduino with new Heroku URL
2. Update all dashboard URLs
3. Test all 4 modules thoroughly
4. Switch DNS if using custom domain

**Fallback Plan:**
If Heroku doesn't work well:

- **Railway.app** - Similar to Heroku, better free tier
- **Render.com** - Good alternative, free SSL
- **Cheap VPS** - Vultr $6/month, full control

---

## ⚡ Quick Start Command List

```bash
# 1. Install Heroku CLI
winget install Heroku.HerokuCLI

# 2. Navigate to project
cd C:\Users\effie\Desktop\agos

# 3. Login
heroku login

# 4. Create app
heroku create agos-flood-monitoring-2025

# 5. Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# 6. Deploy
git push heroku main

# 7. Check status
heroku ps
heroku logs --tail

# 8. Open app
heroku open
```

---

## 📞 Need Help Deciding?

**Ask yourself:**

1. Is Arduino connecting via WiFi (internet) or USB (local)?

   - WiFi → ✅ Heroku works
   - USB → ❌ Need local server

2. How important is 24/7 uptime?

   - Critical → ❌ Don't use free tiers
   - Demo/Testing → ✅ Free tiers OK

3. Will database grow large (>10,000 records)?

   - Yes → ⚠️ Need paid database plan
   - No → ✅ Free tier sufficient

4. Do you need SSH access for debugging?
   - Yes → ❌ Heroku limited
   - No → ✅ Heroku fine

---

## 🚀 Want me to set up the deployment?

Let me know your choice, and I can:

1. ✅ Create all Heroku configuration files
2. ✅ Update database for PostgreSQL compatibility
3. ✅ Set up GitHub Actions for auto-deploy
4. ✅ Create migration scripts for your data
5. ✅ Update Arduino code with new URLs

**What would you like to do?**

- Deploy to Heroku with GitHub Student Pack?
- Try Railway.app instead?
- Stick with DigitalOcean but find cheaper alternative?
- Something else?

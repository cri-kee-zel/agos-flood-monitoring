# ✅ SIM800L to Android SMS Gateway Migration Checklist

## Complete Migration Guide for AGOS v4.3+

**Migration Date:** ******\_\_\_******
**Operator:** ******\_\_\_******
**Phone Model:** ******\_\_\_******

---

## 📋 PRE-MIGRATION

### **Planning**

- [ ] Read `ANDROID_SMS_GATEWAY_SETUP.md`
- [ ] Read `SMS_QUICK_REFERENCE.md`
- [ ] Decide: Local or Cloud mode
- [ ] Choose dedicated Android phone (Android 5.0+)
- [ ] Ensure phone has SIM card with SMS credits
- [ ] Backup current SIM800L configuration

### **Network Preparation (Local Mode Only)**

- [ ] Assign static IP to Android phone
- [ ] Note phone IP address: `___________________`
- [ ] Verify phone on same WiFi as AGOS server
- [ ] Test ping from server to phone
- [ ] Ensure port 8080 is accessible

---

## 📱 ANDROID APP INSTALLATION

### **Download & Install**

- [ ] Download APK from: https://github.com/capcom6/android-sms-gateway/releases
- [ ] Transfer APK to phone
- [ ] Enable "Unknown Sources" in Settings
- [ ] Install APK
- [ ] Open app successfully

### **Grant Permissions**

- [ ] SEND_SMS (Required)
- [ ] READ_PHONE_STATE (Required for dual SIM)
- [ ] READ_SMS (Optional - for history)
- [ ] RECEIVE_SMS (Optional - for webhooks)
- [ ] RECEIVE_MMS (Optional - for MMS webhooks)

### **Configure Mode**

**If using Local Mode:**

- [ ] Toggle "Local Server" ON
- [ ] Tap "Online" button (turns green)
- [ ] Note Local IP: `___________________`
- [ ] Note Username: `___________________`
- [ ] Note Password: `___________________`

**If using Cloud Mode:**

- [ ] Toggle "Cloud Server" ON
- [ ] Tap "Online" button (turns green)
- [ ] Note Username: `___________________`
- [ ] Note Password: `___________________`

---

## 🔧 AGOS CODE UPDATES

### **Update Module 4 Configuration**

File: `c:\Users\effie\Desktop\agos\module_4\module4-app.js`

- [ ] Open file in VS Code
- [ ] Locate `SMS_GATEWAY` configuration (around line 15)
- [ ] Update `mode` to "local" or "cloud"
- [ ] Update `local.url` with phone IP (Local mode)
- [ ] Update `local.username` with noted username
- [ ] Update `local.password` with noted password
- [ ] OR update `cloud.username` and `cloud.password` (Cloud mode)
- [ ] Save file

**Configuration Values:**

```javascript
mode: "_________", // "local" or "cloud"
url: "_____________________", // Phone IP + :8080/message
username: "_____________________",
password: "_____________________"
```

### **Remove SIM800L References (Optional)**

If you want to completely remove old SIM800L code:

- [ ] Remove SIM800L Arduino wiring
- [ ] Comment out SIM800L code in Arduino sketches
- [ ] Remove `/api/send-sms` endpoint from server.js (if it exists)
- [ ] Update documentation references

---

## 🧪 TESTING

### **Test 1: Direct API Test**

From your computer, test the Android gateway:

```bash
curl -X POST -u USERNAME:PASSWORD \
  -H "Content-Type: application/json" \
  -d '{"message": "AGOS Test", "phoneNumbers": ["+639171234567"]}' \
  http://PHONE_IP:8080/message
```

- [ ] Command executed successfully
- [ ] Response received: `{"id": "...", "state": "Pending"}`
- [ ] SMS received on test phone
- [ ] Check Android app logs show sent message

### **Test 2: Module 4 Interface Test**

- [ ] Open AGOS: http://localhost:3000/module_4
- [ ] Login with operator credentials
- [ ] Navigate to Recipients Management
- [ ] Add test recipient (your phone): `+63_________________`
- [ ] Click "Weather Update" button
- [ ] Verify alert sent confirmation
- [ ] Check SMS received on test phone
- [ ] Verify message content matches

### **Test 3: All Alert Types**

Test each alert type:

- [ ] 🚨 Flash Flood Alert
- [ ] ⚠️ Flood Watch
- [ ] 🌧️ Weather Update
- [ ] ✅ All Clear

For each:

- SMS received? \_\_\_
- Message correct? \_\_\_
- Delivery status OK? \_\_\_

### **Test 4: Cooldown System**

- [ ] Send one alert
- [ ] Verify all 4 buttons disabled (grayed out)
- [ ] Verify countdown timer shows "⏳ Wait X:XX"
- [ ] Wait 3 minutes
- [ ] Verify buttons re-enabled
- [ ] Verify original text restored

### **Test 5: Multiple Recipients**

- [ ] Add 3+ recipients to list
- [ ] Send one alert
- [ ] Verify all recipients received SMS
- [ ] Check Android app logs for all sends
- [ ] Verify no errors in server logs

---

## 🪝 WEBHOOK SETUP (Optional)

### **Enable Incoming SMS**

Register webhook with Android gateway:

```bash
curl -X POST -u USERNAME:PASSWORD \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agos-webhook",
    "url": "http://SERVER_IP:3000/api/sms-webhook",
    "event": "sms:received"
  }' \
  http://PHONE_IP:8080/webhooks
```

- [ ] Webhook registered successfully
- [ ] Verify with: `curl -u user:pass http://phone-ip:8080/webhooks`

### **Test Webhook**

- [ ] Send SMS to gateway phone
- [ ] Check Module 4 Arduino Monitor for incoming message
- [ ] Check server logs: `pm2 logs agos-server | grep sms-received`
- [ ] Verify message displayed correctly

---

## 🚀 DEPLOYMENT

### **Local Deployment**

- [ ] Commit code changes: `git add . && git commit -m "Migrate to Android SMS Gateway"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Restart local server: `npm start`
- [ ] Test from browser: http://localhost:3000/module_4
- [ ] Verify all functionality works

### **Server Deployment (Digital Ocean)**

- [ ] SSH to server: `ssh agosadmin@178.128.83.244`
- [ ] Navigate to project: `cd agos-flood-monitoring`
- [ ] Pull changes: `git pull origin main`
- [ ] Install dependencies: `npm install`
- [ ] Restart PM2: `pm2 restart agos-server`
- [ ] Check status: `pm2 status`
- [ ] Check logs: `pm2 logs agos-server --lines 20`
- [ ] Test from browser: http://178.128.83.244:3000/module_4

---

## 📊 POST-MIGRATION VALIDATION

### **Functional Tests**

- [ ] All 4 alert types send successfully
- [ ] Recipients management works (add/delete)
- [ ] Message customization works
- [ ] Cooldown timer functions correctly
- [ ] Arduino Monitor displays logs
- [ ] WebSocket connection stable
- [ ] No console errors (F12)

### **Performance Tests**

- [ ] SMS delivery time < 5 seconds (Local mode)
- [ ] SMS delivery time < 15 seconds (Cloud mode)
- [ ] App responds quickly to button clicks
- [ ] No lag or freezing
- [ ] Phone battery drain acceptable

### **Reliability Tests**

- [ ] Send 10 test SMS in a row
- [ ] All delivered? \_\_\_/10
- [ ] Average delivery time: \_\_\_ seconds
- [ ] Any errors? Yes / No
- [ ] If errors, describe: **********\_\_\_**********

---

## 📝 DOCUMENTATION

### **Update System Docs**

- [ ] Update operator training manual
- [ ] Update system architecture diagram
- [ ] Update deployment guide
- [ ] Update troubleshooting guide
- [ ] Print `SMS_QUICK_REFERENCE.md` for operators

### **Record Configuration**

**System Configuration:**

```
Mode: Local / Cloud (circle one)
Phone IP: _____________________
Username: _____________________
Password: _____________________
Phone Model: _____________________
SIM Provider: _____________________
```

**Network Configuration:**

```
AGOS Server IP: _____________________
Gateway Phone IP: _____________________
WiFi Network: _____________________
```

---

## 🎓 OPERATOR TRAINING

### **Training Checklist**

- [ ] Show operators new Module 4 interface
- [ ] Demonstrate sending test alert
- [ ] Explain cooldown system (3 minutes)
- [ ] Show message customization
- [ ] Demonstrate recipients management
- [ ] Show Arduino Monitor panel
- [ ] Explain webhook incoming SMS
- [ ] Review troubleshooting guide
- [ ] Practice emergency scenarios

### **Training Scenarios**

Test operators on:

- [ ] **Scenario 1:** Send flash flood alert
- [ ] **Scenario 2:** Add/remove recipient
- [ ] **Scenario 3:** Customize message
- [ ] **Scenario 4:** Handle "Failed to fetch" error
- [ ] **Scenario 5:** Check Android app status
- [ ] **Scenario 6:** Review incoming SMS

---

## 🔧 MAINTENANCE SETUP

### **Daily Checks**

Create daily checklist for operators:

- [ ] Check Android app shows "Online"
- [ ] Verify phone battery > 20%
- [ ] Check SIM balance/load
- [ ] Send test SMS
- [ ] Review previous day's logs

### **Weekly Tasks**

- [ ] Review all sent alerts
- [ ] Update recipient list if needed
- [ ] Check for app updates
- [ ] Backup configuration
- [ ] Test all 4 alert types

### **Monthly Tasks**

- [ ] Update Android SMS Gateway app
- [ ] Review and optimize message templates
- [ ] Audit recipient list
- [ ] Test disaster recovery procedures
- [ ] Train new operators

---

## 🆘 ROLLBACK PLAN (If Needed)

**If migration fails, rollback procedure:**

### **Emergency Rollback**

1. [ ] Restore SIM800L hardware connection
2. [ ] Revert code: `git revert HEAD`
3. [ ] Push: `git push origin main`
4. [ ] Deploy: `ssh server "cd agos && git pull && pm2 restart agos-server"`
5. [ ] Test SIM800L functionality
6. [ ] Document issues for future migration attempt

### **Rollback Testing**

- [ ] SIM800L sends SMS successfully
- [ ] Module 4 interface works
- [ ] All recipients receive messages
- [ ] No functionality loss

---

## ✅ MIGRATION COMPLETE

### **Sign-Off**

**Migration completed by:** ********\_\_\_********
**Date:** ********\_\_\_********
**Time:** ********\_\_\_********

**Validated by:** ********\_\_\_********
**Date:** ********\_\_\_********

### **Final Checklist**

- [ ] All tests passed
- [ ] Documentation updated
- [ ] Operators trained
- [ ] Monitoring in place
- [ ] Backup plan documented
- [ ] System stable for 24 hours
- [ ] No critical issues

### **Notes & Issues**

```
_______________________________________________________
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

## 📞 POST-MIGRATION SUPPORT

**If you encounter issues:**

1. Check `SMS_QUICK_REFERENCE.md` troubleshooting section
2. Review server logs: `pm2 logs agos-server`
3. Check Android app logs
4. Test with curl command
5. Contact Android SMS Gateway support if app issue

**Support Resources:**

- AGOS Docs: `/agos/documents/`
- Android Gateway Docs: https://docs.sms-gate.app
- Discord: https://discord.gg/vv9raFK4gX
- GitHub Issues: https://github.com/capcom6/android-sms-gateway/issues

---

**Congratulations on successful migration! 🎉📱**

_AGOS v4.3+ with Android SMS Gateway_

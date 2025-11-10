# 📱 AGOS SMS Quick Reference Card

## Android SMS Gateway - Operator Guide

---

## 🚀 QUICK START (5 MINUTES)

### **1. Install App on Android Phone**

- Download APK: https://github.com/capcom6/android-sms-gateway/releases
- Install and grant SMS permissions

### **2. Choose Mode**

**Local Mode** (Same WiFi):

- Toggle "Local Server" ON
- Tap "Online" button
- Note: IP address (e.g., `192.168.1.100:8080`)
- Note: Username & Password

**Cloud Mode** (Anywhere):

- Toggle "Cloud Server" ON
- Tap "Online" button
- Note: Username & Password

### **3. Configure AGOS**

Edit `module_4/module4-app.js`:

```javascript
SMS_GATEWAY: {
  mode: "local", // or "cloud"
  local: {
    url: "http://192.168.1.100:8080/message", // ← Your phone IP
    username: "user_abc123", // ← From app
    password: "pass_xyz789",  // ← From app
  },
},
```

### **4. Test**

- Open Module 4: http://localhost:3000/module_4
- Add your phone number
- Click "Weather Update" button
- Check phone for SMS ✅

---

## 📊 AT-A-GLANCE COMPARISON

| Item                | SIM800L (Old)        | Android SMS Gateway (New) |
| ------------------- | -------------------- | ------------------------- |
| **Hardware**        | GSM module + Arduino | Android phone only        |
| **Setup Time**      | 2 hours              | 5 minutes                 |
| **Connection**      | Serial (AT commands) | HTTP API (REST)           |
| **Reliability**     | Medium               | High                      |
| **Message Format**  | Plain text           | JSON                      |
| **Status Tracking** | Manual               | Built-in                  |
| **Webhooks**        | No                   | Yes                       |
| **Cost**            | $15 + SIM            | Free app + SIM            |

---

## 🔧 CONFIGURATION MODES

### **Local Mode**

```
✅ Faster (direct connection)
✅ No internet needed on phone
✅ Complete privacy
✅ No cloud dependency
❌ Phone must be on same WiFi
❌ Fixed IP recommended
```

### **Cloud Mode**

```
✅ Works from anywhere
✅ No network configuration
✅ Multiple devices supported
✅ Automatic failover
⚠️ Requires internet
⚠️ Relies on cloud service
```

---

## 📤 SENDING SMS

### **From Module 4 UI**

1. Navigate to Module 4
2. Add recipients (international format: `+639171234567`)
3. Click any alert button:
   - 🚨 Flash Flood Alert
   - ⚠️ Flood Watch
   - 🌧️ Weather Update
   - ✅ All Clear

### **Via API (Advanced)**

**Local:**

```bash
curl -X POST -u username:password \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "phoneNumbers": ["+639171234567"]}' \
  http://192.168.1.100:8080/message
```

**Cloud:**

```bash
curl -X POST -u username:password \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "phoneNumbers": ["+639171234567"]}' \
  https://api.sms-gate.app/3rdparty/v1/message
```

---

## 📥 RECEIVING SMS (Webhooks)

### **Enable Webhooks**

Register webhook with Android app:

```bash
curl -X POST -u username:password \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agos-webhook",
    "url": "http://YOUR-SERVER:3000/api/sms-webhook",
    "event": "sms:received"
  }' \
  http://192.168.1.100:8080/webhooks
```

### **View Incoming SMS**

Incoming messages appear in:

- Module 4 → Arduino Monitor panel
- Server logs: `pm2 logs agos-server`

---

## 🔐 CREDENTIALS MANAGEMENT

### **Find Credentials**

Open Android SMS Gateway app → View credentials on screen

### **Update AGOS**

Edit `module4-app.js` → Update username/password

### **Regenerate Credentials**

In app → Toggle server OFF → Toggle ON → New credentials generated

---

## ⚠️ TROUBLESHOOTING

### **"Failed to fetch"**

- ✅ Check phone app shows "Online"
- ✅ Verify phone IP is correct
- ✅ Ping phone: `ping 192.168.1.100`
- ✅ Test in browser: `http://192.168.1.100:8080`

### **"401 Unauthorized"**

- ✅ Check credentials match exactly
- ✅ Re-generate credentials in app
- ✅ Update `module4-app.js`

### **SMS not sending**

- ✅ Check phone signal
- ✅ Check SIM balance/load
- ✅ Verify international format: `+639171234567`
- ✅ Check app logs

### **Webhooks not working**

- ✅ Phone needs internet (Cloud mode)
- ✅ Phone needs network access (Local mode)
- ✅ Check webhook registered: `curl -u user:pass http://phone-ip:8080/webhooks`
- ✅ Test endpoint: `curl -X POST http://server:3000/api/sms-webhook`

---

## 📞 PHONE NUMBER FORMAT

### **✅ CORRECT**

```
+639171234567  (Philippines)
+12025551234   (USA)
+447700900123  (UK)
```

### **❌ WRONG**

```
09171234567    (Missing country code)
9171234567     (Missing + and country code)
+63-917-123-4567  (Has dashes)
```

---

## 🔄 DAILY OPERATIONS

### **Morning Checklist**

- [ ] Check phone battery (>20%)
- [ ] Verify app shows "Online"
- [ ] Check SIM balance/load
- [ ] Test with one SMS

### **Before Sending Alerts**

- [ ] Verify recipient list is current
- [ ] Check message content
- [ ] Confirm phone signal is strong
- [ ] Note cooldown timer (3 minutes)

### **After Sending**

- [ ] Check app logs for delivery status
- [ ] Monitor for incoming responses
- [ ] Log any issues

---

## 📊 MESSAGE LIMITS

| Limit Type              | Value                     |
| ----------------------- | ------------------------- |
| **SMS Length**          | 160 characters (standard) |
| **Recipients per send** | Unlimited (app splits)    |
| **Daily SMS (app)**     | Unlimited                 |
| **Daily SMS (carrier)** | ~100-500 (varies)         |
| **Cooldown (AGOS)**     | 3 minutes between alerts  |

---

## 🆘 EMERGENCY CONTACTS

**Android SMS Gateway Issues:**

- Discord: https://discord.gg/vv9raFK4gX
- Email: support@sms-gate.app
- GitHub: https://github.com/capcom6/android-sms-gateway/issues

**AGOS Integration Issues:**

- Check Module 4 console (F12)
- Check server: `pm2 logs agos-server`
- Check Android app logs

---

## 📚 USEFUL COMMANDS

```bash
# Test SMS Gateway
curl -X POST -u user:pass \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "phoneNumbers": ["+639171234567"]}' \
  http://192.168.1.100:8080/message

# Check registered webhooks
curl -u user:pass http://192.168.1.100:8080/webhooks

# View AGOS server logs
pm2 logs agos-server

# Restart AGOS server
pm2 restart agos-server

# Check server status
pm2 status
```

---

## 🎯 BEST PRACTICES

1. **Keep phone charged** - Use dedicated power source
2. **Static IP** - Set in phone WiFi settings (Local mode)
3. **Test regularly** - Send test SMS daily
4. **Monitor balance** - Check SIM load weekly
5. **Backup phone** - Have spare Android device ready
6. **Update app** - Check for updates monthly
7. **Log everything** - Keep records of sent alerts

---

## 📖 FULL DOCUMENTATION

- **Setup Guide:** `ANDROID_SMS_GATEWAY_SETUP.md`
- **Webhook Guide:** `SMS_WEBHOOK_INTEGRATION.md`
- **Official Docs:** https://docs.sms-gate.app
- **API Reference:** https://capcom6.github.io/android-sms-gateway/

---

**Print this card and keep near your workstation! 📱**

_Last Updated: November 9, 2025_
_AGOS v4.3+ with Android SMS Gateway_

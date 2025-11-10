# 📱 Android SMS Gateway Setup Guide for AGOS

## Complete Migration from SIM800L to Android SMS Gateway

**Date:** November 9, 2025
**AGOS Version:** v4.3+
**Gateway Version:** Android SMS Gateway v1.51.0+

---

## 📋 TABLE OF CONTENTS

1. [Why Android SMS Gateway?](#why-android-sms-gateway)
2. [Installation](#installation)
3. [Configuration Modes](#configuration-modes)
4. [AGOS Integration](#agos-integration)
5. [Testing](#testing)
6. [Webhooks (Optional)](#webhooks-optional)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## 🎯 WHY ANDROID SMS GATEWAY?

### **Advantages over SIM800L:**

| Feature              | SIM800L Module               | Android SMS Gateway        |
| -------------------- | ---------------------------- | -------------------------- |
| **Hardware**         | Separate GSM module required | Use existing Android phone |
| **Interface**        | AT commands via Serial       | REST API (HTTP/JSON)       |
| **Reliability**      | Limited, prone to issues     | Modern, stable             |
| **Multiple SIM**     | No                           | Yes (dual SIM support)     |
| **Message Tracking** | Manual                       | Built-in status tracking   |
| **Webhooks**         | No                           | Yes (receive SMS)          |
| **Encryption**       | No                           | End-to-end encryption      |
| **Cost**             | ~$10-20 + SIM card           | Free app + SIM card        |
| **Setup Time**       | Complex wiring               | 5 minutes                  |

### **Perfect for AGOS because:**

✅ **No Arduino dependency** - Direct HTTP API from Module 4
✅ **Dual deployment modes** - Local network OR cloud
✅ **Better reliability** - Modern Android vs. GSM module
✅ **Receive responses** - Webhook support for incoming SMS
✅ **Easy maintenance** - Update app vs. reflashing Arduino

---

## 📥 INSTALLATION

### **Step 1: Download the App**

**Option A: Direct APK (Recommended)**

1. Visit: https://github.com/capcom6/android-sms-gateway/releases
2. Download latest APK: `sms-gateway-v1.51.0.apk` (or newer)
3. Transfer to your Android phone
4. Enable "Install from Unknown Sources" in Settings
5. Install the APK

**Option B: Build from Source (Advanced)**

```bash
git clone https://github.com/capcom6/android-sms-gateway.git
cd android-sms-gateway
./gradlew assembleRelease
# APK will be in app/build/outputs/apk/release/
```

### **Step 2: Grant Permissions**

When you first open the app, grant these permissions:

- ✅ **SEND_SMS** - Required to send messages
- ✅ **READ_PHONE_STATE** - Required for SIM selection (dual SIM)
- ✅ **READ_SMS** - Optional (for reading message history)
- ✅ **RECEIVE_SMS** - Optional (for webhooks)
- ✅ **RECEIVE_MMS** - Optional (for MMS webhooks)

---

## ⚙️ CONFIGURATION MODES

The app supports **two modes**. Choose based on your deployment:

### **Mode 1: Local Server** (Recommended for AGOS)

**Best for:** Same WiFi network, faster, no internet required

#### **Setup:**

1. Open Android SMS Gateway app
2. Toggle **"Local Server"** switch to ON
3. Tap **"Offline"** button at bottom → becomes **"Online"**
4. App will show:
   ```
   Local IP: 192.168.1.100:8080
   Username: user_abc123
   Password: pass_xyz789
   ```
5. **Write down these credentials!** You'll need them for AGOS

#### **Requirements:**

- ✅ Android phone on same WiFi as AGOS server
- ✅ Port 8080 must be accessible
- ✅ Static IP recommended (set in phone's WiFi settings)

---

### **Mode 2: Cloud Server**

**Best for:** Remote deployment, dynamic IPs, internet access available

#### **Setup:**

1. Open Android SMS Gateway app
2. Toggle **"Cloud Server"** switch to ON
3. Tap **"Online"** button at bottom
4. App will show:
   ```
   Cloud Server: api.sms-gate.app
   Username: user_abc123
   Password: pass_xyz789
   ```
5. **Write down these credentials!**

#### **Requirements:**

- ✅ Android phone has internet connection
- ✅ Messages go through cloud (encrypted)
- ✅ Works from anywhere

---

## 🔧 AGOS INTEGRATION

### **Step 1: Update Module 4 Configuration**

Open: `c:\Users\effie\Desktop\agos\module_4\module4-app.js`

Find this section (around line 15):

```javascript
// Android SMS Gateway Configuration
SMS_GATEWAY: {
  mode: "local", // 'local' or 'cloud'
  local: {
    url: "http://192.168.1.100:8080/message", // Update with your Android phone's IP
    username: "", // Set after installing app
    password: "", // Set after installing app
  },
  cloud: {
    url: "https://api.sms-gate.app/3rdparty/v1/message",
    username: "", // Set from app
    password: "", // Set from app
  },
},
```

#### **For Local Mode:**

Update these values:

```javascript
SMS_GATEWAY: {
  mode: "local",
  local: {
    url: "http://192.168.1.100:8080/message", // ← Change to YOUR phone's IP
    username: "user_abc123", // ← From app
    password: "pass_xyz789", // ← From app
  },
  // ... cloud config stays as is
},
```

#### **For Cloud Mode:**

Update these values:

```javascript
SMS_GATEWAY: {
  mode: "cloud", // ← Change to 'cloud'
  local: {
    // ... stays as is
  },
  cloud: {
    url: "https://api.sms-gate.app/3rdparty/v1/message",
    username: "user_abc123", // ← From app
    password: "pass_xyz789", // ← From app
  },
},
```

### **Step 2: Save and Deploy**

```bash
# Commit changes
git add module_4/module4-app.js
git commit -m "Configure Android SMS Gateway credentials"
git push origin main

# Deploy to server (if using Digital Ocean)
ssh agosadmin@178.128.83.244 "cd agos-flood-monitoring && git pull && pm2 restart agos-server"
```

---

## 🧪 TESTING

### **Test 1: Direct API Test (Phone)**

Test directly from your computer to ensure the app is working:

**Local Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{"message": "Test from AGOS", "phoneNumbers": ["+639171234567"]}' \
  http://192.168.1.100:8080/message
```

**Cloud Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{"message": "Test from AGOS", "phoneNumbers": ["+639171234567"]}' \
  https://api.sms-gate.app/3rdparty/v1/message
```

**Expected Response:**

```json
{
  "id": "msg_abc123",
  "state": "Pending",
  "recipients": ["+639171234567"]
}
```

### **Test 2: From Module 4**

1. Open AGOS Module 4: http://localhost:3000/module_4
2. Login with credentials
3. Add a test recipient (your own number)
4. Click any alert button (e.g., "Weather Update")
5. Check your phone for SMS!

### **Test 3: Check App Logs**

In the Android SMS Gateway app:

- Tap "Logs" or "History"
- You should see the sent message
- Status should show "Sent" or "Delivered"

---

## 🪝 WEBHOOKS (Optional - Receive SMS)

Webhooks allow AGOS to receive incoming SMS (e.g., confirmations, responses).

### **Setup Webhook Receiver in Server**

Add this to `server.js`:

```javascript
// Webhook endpoint for incoming SMS
app.post("/api/sms-webhook", express.json(), (req, res) => {
  console.log("📩 Incoming SMS webhook:", req.body);

  const { event, payload } = req.body;

  if (event === "sms:received") {
    const { message, phoneNumber, receivedAt } = payload;

    console.log(`📱 SMS from ${phoneNumber}: ${message}`);

    // Broadcast to Module 4 via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "sms-received",
            phoneNumber,
            message,
            receivedAt,
          })
        );
      }
    });

    // Store in database (optional)
    // db.run("INSERT INTO sms_received ...");
  }

  res.json({ success: true });
});
```

### **Register Webhook with App**

**Local Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{"id": "agos-webhook", "url": "https://YOUR-SERVER.com/api/sms-webhook", "event": "sms:received"}' \
  http://192.168.1.100:8080/webhooks
```

**Cloud Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{"id": "agos-webhook", "url": "https://YOUR-SERVER.com/api/sms-webhook", "event": "sms:received"}' \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

### **Deregister Webhook**

```bash
curl -X DELETE -u user_abc123:pass_xyz789 \
  http://192.168.1.100:8080/webhooks/agos-webhook
```

---

## 🔧 TROUBLESHOOTING

### **Issue: "Failed to fetch" error**

**Symptoms:** AGOS Module 4 shows connection error

**Solutions:**

1. **Check phone is on same network (Local mode)**

   ```bash
   # From your computer, ping the phone
   ping 192.168.1.100
   ```

2. **Verify app is running**

   - Open Android SMS Gateway app
   - Ensure button shows "Online" (green)
   - Check "Local Server" or "Cloud Server" is enabled

3. **Test URL directly in browser**

   - Open: `http://192.168.1.100:8080/message`
   - Should show 401 Unauthorized (means it's working!)

4. **Check firewall**
   - Some phones have firewall apps
   - Ensure port 8080 is allowed

---

### **Issue: "401 Unauthorized"**

**Symptoms:** Authentication failed

**Solutions:**

1. **Check credentials match**

   - Open Android SMS Gateway app
   - Compare username/password with `module4-app.js`
   - They must match exactly

2. **Re-generate credentials**
   - In app, toggle server OFF then ON
   - New credentials will be generated
   - Update `module4-app.js`

---

### **Issue: SMS not sending**

**Symptoms:** No error, but SMS doesn't arrive

**Solutions:**

1. **Check phone has signal**

   - Verify phone can send regular SMS
   - Test by sending manual SMS

2. **Check SIM card balance**

   - Ensure you have SMS credits/load

3. **Check phone number format**

   - Must use international format: `+639171234567`
   - NOT: `09171234567` or `9171234567`

4. **Check app logs**
   - Open Android SMS Gateway app
   - Tap "Logs" or "History"
   - Look for error messages

---

### **Issue: "CORS error" in browser**

**Symptoms:** Browser console shows CORS error

**Solutions:**

This is expected for Local mode when AGOS is on different domain. Two options:

**Option 1: Use Cloud mode instead**

```javascript
mode: "cloud", // Avoids CORS issues
```

**Option 2: Add CORS headers to phone** (Advanced)

- Not directly supported by app
- Use cloud mode or deploy AGOS on same device

---

### **Issue: Messages delayed**

**Symptoms:** SMS arrives 5+ minutes late

**Solutions:**

1. **Check network speed**

   - Slow internet can delay cloud messages
   - Use local mode for faster delivery

2. **Check phone battery saver**

   - Battery saver can delay background tasks
   - Disable for SMS Gateway app

3. **Check mobile operator**
   - Some carriers delay non-premium SMS
   - Contact carrier if persistent

---

## ❓ FAQ

### **Q: Can I use multiple Android phones?**

**A:** Yes! Android SMS Gateway supports multiple devices:

- Each device gets its own credentials
- Messages are distributed across devices
- Great for load balancing and redundancy

### **Q: Do I need internet for Local mode?**

**A:** No! Local mode works entirely on your WiFi network without internet. Only requirements:

- Android phone on same WiFi as AGOS server
- Phone can send SMS (requires mobile network)

### **Q: Can I use my personal phone?**

**A:** Yes, but recommended to use dedicated phone because:

- App uses battery for background service
- Incoming SMS webhooks might interfere
- Better security with separate device

### **Q: What about data privacy?**

**A:**

**Local Mode:**

- ✅ Messages never leave your network
- ✅ No cloud servers involved
- ✅ Complete privacy

**Cloud Mode:**

- 🔐 Messages encrypted end-to-end
- 🔐 Cloud server cannot read content
- 🔐 Only routing, not storage

### **Q: Can I send MMS (images)?**

**A:** Not yet. Current version supports SMS only. MMS receiving is supported via webhooks.

### **Q: How many SMS per day?**

**A:** No limit from the app, but:

- ⚠️ Mobile operators may have limits (100-500 SMS/day)
- ⚠️ Carrier may flag as spam if too many
- 💡 For bulk sending, consider SMS service API

### **Q: What happens if phone is offline?**

**A:**

- Messages will fail immediately
- AGOS will show error
- No retry mechanism (you must resend)
- Consider setting up multiple phones for redundancy

### **Q: Can I use this with Arduino?**

**A:** No need! This completely replaces SIM800L Arduino integration. AGOS Module 4 sends directly to the Android phone via HTTP API.

### **Q: Difference from SIM800L?**

| Feature     | SIM800L            | Android SMS Gateway |
| ----------- | ------------------ | ------------------- |
| Connection  | Serial (Arduino)   | HTTP API (Direct)   |
| Complexity  | High (AT commands) | Low (REST API)      |
| Reliability | Medium             | High                |
| Cost        | ~$15 + wiring      | Free app            |
| Setup time  | 2 hours            | 5 minutes           |

---

## 🎯 QUICK START CHECKLIST

Use this checklist for first-time setup:

- [ ] Downloaded and installed Android SMS Gateway APK
- [ ] Granted all required permissions
- [ ] Enabled Local Server OR Cloud Server
- [ ] Tapped "Online" button (app shows green)
- [ ] Noted down username and password
- [ ] Updated `module4-app.js` with credentials
- [ ] Updated phone IP address (Local mode only)
- [ ] Tested with curl command
- [ ] Added test recipient in Module 4
- [ ] Sent test alert from Module 4
- [ ] Received SMS on test phone ✅

---

## 📞 SUPPORT

**Android SMS Gateway Issues:**

- GitHub: https://github.com/capcom6/android-sms-gateway/issues
- Discord: https://discord.gg/vv9raFK4gX
- Email: support@sms-gate.app

**AGOS Integration Issues:**

- Check Module 4 browser console (F12)
- Check server logs: `pm2 logs agos-server`
- Check Android app logs

---

## 📚 ADDITIONAL RESOURCES

- **Official Docs:** https://docs.sms-gate.app
- **API Reference:** https://capcom6.github.io/android-sms-gateway/
- **CLI Tool:** https://sms-gate.app/integration/cli/
- **GitHub Repo:** https://github.com/capcom6/android-sms-gateway

---

## 🚀 NEXT STEPS

After successful setup:

1. **Configure multiple recipients** in Module 4
2. **Customize alert messages** for each type
3. **Set up webhooks** to receive responses (optional)
4. **Deploy backup phone** for redundancy (optional)
5. **Test all 4 alert types** (Flash Flood, Flood Watch, Weather Update, All Clear)

---

**Happy Messaging! 📱💬**

_Last Updated: November 9, 2025_
_AGOS v4.3+ | Android SMS Gateway v1.51.0+_

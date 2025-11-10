# 📥 SMS Webhook Integration for Module 4

## Displaying Received SMS in AGOS Module 4

This guide shows how to display incoming SMS messages in Module 4's Arduino Monitor panel.

---

## 🎯 OVERVIEW

With Android SMS Gateway webhooks, AGOS can:

- ✅ Receive SMS responses from residents
- ✅ Display incoming messages in real-time
- ✅ Log all incoming/outgoing SMS
- ✅ Track confirmations and acknowledgments

---

## 🔧 IMPLEMENTATION

### **Step 1: Enable Webhooks in WebSocket Handler**

The incoming SMS handler is already added to `server.js`. When Android SMS Gateway receives an SMS, it will:

1. POST to `http://YOUR-SERVER:3000/api/sms-webhook`
2. Server broadcasts via WebSocket to Module 4
3. Module 4 displays in Arduino Monitor panel

### **Step 2: Add SMS Received Handler to Module 4**

The WebSocket listener in `module4-app.js` (around line 849) already handles messages. We need to add SMS handling:

**Find this section:**

```javascript
arduinoSocket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // ... existing handlers ...
```

**Add this handler:**

```javascript
// Handle incoming SMS from webhook
if (data.type === "sms-received") {
  const { phoneNumber, message, receivedAt } = data;
  const displayTime = new Date(receivedAt).toLocaleString();

  addArduinoLog(`📩 INCOMING SMS`, "info");
  addArduinoLog(`  From: ${phoneNumber}`, "info");
  addArduinoLog(`  Message: ${message}`, "success");
  addArduinoLog(`  Time: ${displayTime}`, "info");
  addArduinoLog(`────────────────────────────────`, "info");
}
```

### **Step 3: Register Webhook with Android SMS Gateway**

After deploying AGOS, register the webhook:

**Local Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agos-webhook",
    "url": "http://YOUR-SERVER-IP:3000/api/sms-webhook",
    "event": "sms:received"
  }' \
  http://192.168.1.100:8080/webhooks
```

**Cloud Mode:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agos-webhook",
    "url": "https://YOUR-DOMAIN.com/api/sms-webhook",
    "event": "sms:received"
  }' \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

---

## 🧪 TESTING

### **Test Incoming SMS**

1. Send SMS to the phone running Android SMS Gateway
2. Check AGOS Module 4 → Arduino Monitor panel
3. You should see:
   ```
   [12:34:56.789] 📩 INCOMING SMS
   [12:34:56.790]   From: +639171234567
   [12:34:56.791]   Message: Received your flood alert, evacuating now!
   [12:34:56.792]   Time: 11/9/2025, 12:34:56 PM
   [12:34:56.793] ────────────────────────────────
   ```

### **Verify Webhook Registration**

List registered webhooks:

**Local Mode:**

```bash
curl -u user_abc123:pass_xyz789 \
  http://192.168.1.100:8080/webhooks
```

**Cloud Mode:**

```bash
curl -u user_abc123:pass_xyz789 \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

**Expected response:**

```json
[
  {
    "id": "agos-webhook",
    "url": "http://YOUR-SERVER:3000/api/sms-webhook",
    "event": "sms:received"
  }
]
```

---

## 📊 WEBHOOK PAYLOAD STRUCTURE

Android SMS Gateway sends this payload:

```json
{
  "event": "sms:received",
  "payload": {
    "messageId": "msg_12345abcde",
    "message": "Thanks for the alert!",
    "phoneNumber": "+639171234567",
    "simNumber": 1,
    "receivedAt": "2025-11-09T12:34:56.000+08:00"
  }
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### **Webhook Authentication (Optional)**

Add authentication to prevent spam:

**Update server.js:**

```javascript
const WEBHOOK_SECRET = "your-secret-key-here"; // Add to .env

app.post("/api/sms-webhook", express.json(), (req, res) => {
  // Verify secret token
  const providedSecret = req.headers["x-webhook-secret"];

  if (providedSecret !== WEBHOOK_SECRET) {
    console.log("❌ Unauthorized webhook request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ... rest of handler
});
```

**Register with secret:**

```bash
curl -X POST -u user_abc123:pass_xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agos-webhook",
    "url": "http://YOUR-SERVER:3000/api/sms-webhook",
    "event": "sms:received",
    "headers": {
      "X-Webhook-Secret": "your-secret-key-here"
    }
  }' \
  http://192.168.1.100:8080/webhooks
```

---

## 🎨 ENHANCED DISPLAY (Optional)

### **Add SMS Panel to Module 4**

Create a dedicated incoming SMS panel in `module4.html`:

```html
<!-- Add after Arduino Monitor Panel -->
<section class="incoming-sms-panel">
  <div class="panel-header">
    <h2>📥 Incoming SMS Messages</h2>
    <div class="sms-count-badge">
      <span id="sms-count">0</span>
      messages received
    </div>
  </div>

  <div class="sms-list" id="incoming-sms-list">
    <div class="no-sms">No incoming messages</div>
  </div>
</section>
```

**Add to module4-app.js:**

```javascript
// Store incoming SMS
this.incomingSMS = [];

// Handler in WebSocket onmessage
if (data.type === "sms-received") {
  this.incomingSMS.unshift(data); // Add to beginning
  this.updateIncomingSMSDisplay();
}

// Display function
updateIncomingSMSDisplay() {
  const smsList = document.getElementById("incoming-sms-list");
  const smsCount = document.getElementById("sms-count");

  if (!smsList) return;

  smsCount.textContent = this.incomingSMS.length;

  if (this.incomingSMS.length === 0) {
    smsList.innerHTML = '<div class="no-sms">No incoming messages</div>';
    return;
  }

  smsList.innerHTML = this.incomingSMS.map(sms => `
    <div class="sms-item">
      <div class="sms-header">
        <span class="sms-phone">${sms.phoneNumber}</span>
        <span class="sms-time">${new Date(sms.receivedAt).toLocaleString()}</span>
      </div>
      <div class="sms-message">${sms.message}</div>
    </div>
  `).join('');
}
```

---

## 🔄 DEREGISTER WEBHOOK

To stop receiving SMS webhooks:

**Local Mode:**

```bash
curl -X DELETE -u user_abc123:pass_xyz789 \
  http://192.168.1.100:8080/webhooks/agos-webhook
```

**Cloud Mode:**

```bash
curl -X DELETE -u user_abc123:pass_xyz789 \
  https://api.sms-gate.app/3rdparty/v1/webhooks/agos-webhook
```

---

## 📋 CHECKLIST

- [ ] Webhook endpoint added to server.js ✅ (already done)
- [ ] SMS handler added to Module 4 WebSocket listener
- [ ] AGOS server deployed with webhook endpoint
- [ ] Webhook registered with Android SMS Gateway app
- [ ] Test SMS sent to gateway phone
- [ ] Incoming SMS appears in Module 4 Arduino Monitor

---

## 🐛 TROUBLESHOOTING

### **SMS not appearing in Module 4**

1. Check server logs:

   ```bash
   pm2 logs agos-server | grep "sms-webhook"
   ```

2. Test webhook directly:

   ```bash
   curl -X POST http://localhost:3000/api/sms-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "sms:received",
       "payload": {
         "messageId": "test123",
         "message": "Test message",
         "phoneNumber": "+639171234567",
         "simNumber": 1,
         "receivedAt": "2025-11-09T12:00:00Z"
       }
     }'
   ```

3. Check Module 4 console (F12) for WebSocket messages

### **Webhook not triggering**

1. Verify webhook is registered:

   ```bash
   curl -u user:pass http://phone-ip:8080/webhooks
   ```

2. Check phone can reach server:

   - Phone must have outgoing internet (Cloud mode)
   - Phone must be on same network (Local mode)

3. Check Android app logs for webhook errors

---

**Happy messaging! 📱📥**

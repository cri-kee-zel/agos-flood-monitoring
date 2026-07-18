const https = require("https");
const creds = "PGTRN_:glootxy0ncshl1";
const auth = Buffer.from(creds).toString("base64");
const data = JSON.stringify({
  message: "TEST direct gateway auth",
  phoneNumbers: ["+10000000000"],
});

const options = {
  hostname: "api.sms-gate.app",
  port: 443,
  path: "/3rdparty/v1/message",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
    Authorization: `Basic ${auth}`,
  },
};

const req = https.request(options, (res) => {
  console.log("STATUS:", res.statusCode);
  console.log("HEADERS:", res.headers);
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("BODY:", body);
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error("Request error", e);
  process.exit(1);
});

req.write(data);
req.end();

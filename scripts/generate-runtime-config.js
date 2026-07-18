const fs = require("fs");
const path = require("path");

const backend = process.env.BACKEND_URL || "";
const out = `window.AGOS_BACKEND = ${JSON.stringify(backend)};`;

const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "runtime-config.js"), out);
console.log("Wrote public/runtime-config.js ->", backend || "(empty)");

// Structured JSON logger.
// Every log line is one JSON object: {"timestamp","level","service",
// "message", ...fields}. That is what Logstash parses — plain text
// logs would need a grok pattern for every format, JSON needs none.
// Logs always go to stdout (docker logs). If LOGSTASH_HOST is set,
// each line is also sent over TCP to Logstash; if Logstash is down,
// logging to stdout continues and the app keeps running.
const net = require("node:net");

const SERVICE = process.env.SERVICE_NAME || "project-9-app";
const LOGSTASH_HOST = process.env.LOGSTASH_HOST || "";
const LOGSTASH_PORT = Number(process.env.LOGSTASH_PORT) || 5000;

let socket = null;
let socketReady = false;

if (LOGSTASH_HOST) {
  socket = new net.Socket();
  socket.on("error", () => {
    socketReady = false;
  });
  socket.on("close", () => {
    socketReady = false;
  });
  socket.connect(LOGSTASH_PORT, LOGSTASH_HOST, () => {
    socketReady = true;
  });
}

function log(level, message, fields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    message,
    ...fields
  };
  const line = JSON.stringify(entry);
  console.log(line);
  if (socketReady) {
    try {
      socket.write(`${line}\n`);
    } catch {
      // Logstash send failed — stdout already has the line.
    }
  }
  return entry;
}

module.exports = {
  log,
  info: (message, fields) => log("info", message, fields),
  warn: (message, fields) => log("warn", message, fields),
  error: (message, fields) => log("error", message, fields)
};

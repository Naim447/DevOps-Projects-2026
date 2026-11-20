const express = require("express");
const crypto = require("node:crypto");
const logger = require("./logger");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json());

// Log every request as structured JSON: method, path, status, duration.
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("http_request", {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100
    });
  });
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from the ELK Stack project!",
    project: "Project 9 - ELK Stack",
    version: process.env.APP_VERSION || "dev",
    status: "healthy"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

let visitCount = 0;
app.get("/api/visits", (req, res) => {
  visitCount += 1;
  logger.info("visit_recorded", { request_id: req.requestId, visit: visitCount });
  res.status(200).json({ visits: visitCount });
});

// A searchable event: try /api/search?q=docker, then find it in Kibana
// by searching for the query text.
app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "");
  logger.info("search", { request_id: req.requestId, query: q, results: q ? 3 : 0 });
  res.status(200).json({ query: q, results: q ? ["docker", "kubernetes", "terraform"] : [] });
});

// An error event, so Kibana has errors to filter for.
app.get("/api/error", (req, res) => {
  logger.error("simulated_error", { request_id: req.requestId, reason: "demo error endpoint" });
  res.status(500).json({ error: "Simulated error for log testing" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    logger.info("app_started", { port: PORT });
    console.log(`Application listening on port ${PORT}`);
  });
}

module.exports = app;

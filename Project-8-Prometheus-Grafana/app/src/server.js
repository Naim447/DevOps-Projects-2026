const express = require("express");
const client = require("prom-client");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json());

// Default metrics: process CPU/memory, Node event loop, GC, etc.
client.collectDefaultMetrics();

// Custom metrics — these are what the Grafana dashboard shows.
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests, by method, route and status code",
  labelNames: ["method", "route", "status"]
});

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

const visits = new client.Counter({
  name: "app_visits_total",
  help: "Total visits to the /api/visits endpoint"
});

// Middleware: time every request and count it once it finishes.
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route ? req.route.path : req.path;
    httpRequests.inc({ method: req.method, route, status: res.statusCode });
    httpDuration.observe({ method: req.method, route }, duration);
  });
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from the Prometheus and Grafana project!",
    project: "Project 8 - Prometheus and Grafana",
    version: process.env.APP_VERSION || "dev",
    status: "healthy"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/visits", (_req, res) => {
  visits.inc();
  res.status(200).json({ visits: "counted — see app_visits_total in Prometheus" });
});

// A slow endpoint on purpose, so the latency panel has something to show.
app.get("/api/slow", async (_req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  res.status(200).json({ message: "That took about 0.8 seconds" });
});

// An endpoint that returns 500, so the error-rate alert has something to fire on.
app.get("/api/error", (_req, res) => {
  res.status(500).json({ error: "Simulated error for alert testing" });
});

// Prometheus scrapes this endpoint.
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application listening on port ${PORT}`);
  });
}

module.exports = app;

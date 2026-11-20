const express = require("express");
const os = require("node:os");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json());

// Pod name is the container hostname in Kubernetes — returning it
// proves which replica answered, which is how you see load-balancing
// and self-healing in action.
function podInfo() {
  return {
    pod: process.env.HOSTNAME || os.hostname(),
    node: process.env.NODE_NAME || "unknown",
    version: process.env.APP_VERSION || "dev",
    message: process.env.APP_MESSAGE || "Hello from Kubernetes!"
  };
}

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from Kubernetes!",
    project: "Project 5 - Kubernetes",
    status: "healthy",
    ...podInfo()
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", ...podInfo() });
});

app.get("/api/info", (_req, res) => {
  res.status(200).json({
    project: "Project 5 - Kubernetes",
    ...podInfo(),
    uptimeSeconds: Math.floor(process.uptime())
  });
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

const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from the Jenkins CI/CD pipeline!",
    project: "Project 3 - Jenkins",
    version: process.env.APP_VERSION || "dev",
    status: "healthy"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
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

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

async function startServer() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  return server;
}

async function stopServer(server) {
  await new Promise((resolve) => server.close(() => resolve()));
}

test("GET / returns project information", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.project, "Project 8 - Prometheus and Grafana");
  } finally {
    await stopServer(server);
  }
});

test("GET /health returns ok", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
  } finally {
    await stopServer(server);
  }
});

test("GET /metrics exposes Prometheus metrics", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    await fetch(`http://127.0.0.1:${address.port}/api/visits`);
    const response = await fetch(`http://127.0.0.1:${address.port}/metrics`);
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.match(text, /http_requests_total/);
    assert.match(text, /app_visits_total/);
    assert.match(text, /http_request_duration_seconds/);
  } finally {
    await stopServer(server);
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const logger = require("../src/logger");
const app = require("../src/server");

async function startServer() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  return server;
}

async function stopServer(server) {
  await new Promise((resolve) => server.close(() => resolve()));
}

test("logger produces a valid JSON log line", () => {
  const entry = logger.info("test_event", { request_id: "test-123" });
  assert.equal(entry.level, "info");
  assert.equal(entry.message, "test_event");
  assert.equal(entry.request_id, "test-123");
  assert.equal(typeof entry.timestamp, "string");
  // The returned object must be JSON-serialisable (it is the log line).
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(entry)));
});

test("GET / returns project information", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.project, "Project 9 - ELK Stack");
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

test("GET /api/search returns results for a query", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/search?q=docker`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.query, "docker");
    assert.equal(body.results.length, 3);
  } finally {
    await stopServer(server);
  }
});

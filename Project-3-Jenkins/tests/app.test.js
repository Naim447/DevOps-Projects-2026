const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

// The spec's test started fetching immediately after app.listen(),
// before the server was actually listening, so fetch failed and
// server.close() then threw ERR_SERVER_NOT_RUNNING on Node 22+.
// Wait for the 'listening' event first — same two tests, same assertions.
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
    assert.equal(body.project, "Project 3 - Jenkins");
    assert.equal(body.status, "healthy");
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

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

// These two tests need no database: they check the routes that work
// even when MongoDB / Redis are not running. The /api/* routes are
// exercised live with docker compose (see README section 7).
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
    assert.equal(body.project, "Project 4 - Docker Compose");
    assert.equal(body.status, "healthy");
    assert.deepEqual(body.stack, ["Node.js", "Express", "MongoDB", "Redis", "Nginx"]);
  } finally {
    await stopServer(server);
  }
});

test("GET /unknown returns 404", async () => {
  const server = await startServer();
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/unknown`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.error, "Route not found");
  } finally {
    await stopServer(server);
  }
});

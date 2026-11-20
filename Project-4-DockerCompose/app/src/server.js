const express = require("express");
const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || "";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// --- Lazy clients: the app starts even if Mongo/Redis are not up yet.
// /health reports each dependency honestly instead of crashing the app.
let mongoClient = null;
let mongoDb = null;
let redisClient = null;

async function mongoStatus() {
  if (!MONGO_URI) return "not-configured";
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoClient.connect();
      mongoDb = mongoClient.db();
    }
    await mongoDb.command({ ping: 1 });
    return "ok";
  } catch {
    try { await mongoClient?.close(); } catch { /* already down */ }
    mongoClient = null;
    mongoDb = null;
    return "unavailable";
  }
}

async function redisStatus() {
  // node-redis retries connecting forever by default — without a
  // connect timeout and reconnectStrategy: false, /health would hang
  // for minutes when Redis is down instead of reporting "unavailable".
  try {
    if (!redisClient) {
      redisClient = createClient({
        url: REDIS_URL,
        socket: { connectTimeout: 2000, reconnectStrategy: false }
      });
      redisClient.on("error", () => {});
      await Promise.race([
        redisClient.connect(),
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("redis connect timeout")), 2500))
      ]);
    }
    return (await redisClient.ping()) === "PONG" ? "ok" : "unavailable";
  } catch {
    try { await redisClient?.quit(); } catch { /* already down */ }
    redisClient = null;
    return "unavailable";
  }
}

app.disable("x-powered-by");
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from Docker Compose!",
    project: "Project 4 - Docker Compose",
    version: process.env.APP_VERSION || "dev",
    status: "healthy",
    stack: ["Node.js", "Express", "MongoDB", "Redis", "Nginx"]
  });
});

app.get("/health", async (_req, res) => {
  const [mongo, redis] = await Promise.all([mongoStatus(), redisStatus()]);
  const healthy = mongo !== "unavailable" && redis !== "unavailable";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo,
    redis
  });
});

// --- MongoDB demo: a tiny visit counter, stored in Mongo ---
app.get("/api/visits", async (_req, res) => {
  if ((await mongoStatus()) !== "ok") {
    return res.status(503).json({ error: "MongoDB unavailable" });
  }
  const visits = mongoDb.collection("visits");
  const result = await visits.findOneAndUpdate(
    { _id: "total" },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  res.status(200).json({ visits: result.count });
});

// --- Redis demo: cache a value for 60 seconds ---
app.get("/api/cache", async (req, res) => {
  if ((await redisStatus()) !== "ok") {
    return res.status(503).json({ error: "Redis unavailable" });
  }
  const key = req.query.key || "hello";
  const cached = await redisClient.get(key);
  if (cached) return res.status(200).json({ key, value: cached, source: "cache" });
  const value = `cached-at-${new Date().toISOString()}`;
  await redisClient.set(key, value, { EX: 60 });
  res.status(200).json({ key, value, source: "fresh" });
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

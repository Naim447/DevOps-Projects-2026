// Runs once, on first start of an empty mongo_data volume.
// Creates the app user used by the app service (see docker-compose.yml).
// These values match the defaults in .env.example — if you change
// MONGO_USER / MONGO_PASSWORD / MONGO_DB in .env, change them here too,
// then delete the mongo_data volume and start again (docker compose down -v).
db = db.getSiblingDB("appdb");
db.createUser({
  user: "appuser",
  pwd: "apppassword",
  roles: [{ role: "readWrite", db: "appdb" }]
});
db.createCollection("visits");

# Troubleshooting — Project 4

## `docker compose up` fails: port already in use
- Something else is on port 80, 3000, 6379 or 27017. Find it: `sudo ss -tlnp | grep -E ':(80|3000|6379|27017)'`
- Stop the other service, or change the published port in `docker-compose.yml`.

## App is unhealthy / keeps restarting
- Check the logs: `docker compose logs app`
- Check the dependencies first: `docker compose ps` — are `mongo` and `redis` healthy?
- The app's `/health` returns 503 (`degraded`) if Mongo or Redis is unavailable. That is by design — fix the database, not the health endpoint.

## Mongo authentication fails
- The init script (`mongo-init/init.js`) runs **only once**, on first start of an empty `mongo_data` volume.
- If you changed `MONGO_USER` / `MONGO_PASSWORD` in `.env` after the first start, the old user still exists. Fix it with: `docker compose down -v` (deletes all data), then `docker compose up -d --build`.
- Check the user exists: `docker compose exec mongo mongosh -u root -p rootpassword --eval 'db.getSiblingDB("appdb").getUsers()'`

## `/api/visits` returns 503 "MongoDB unavailable"
- The app could not reach Mongo. Check `docker compose logs mongo` and that `MONGO_URI` in the app service matches the user/database in `mongo-init/init.js`.

## `/api/cache` returns 503 "Redis unavailable"
- Check `docker compose exec redis redis-cli ping` returns `PONG`.
- The first call to `/api/cache?key=hello` is `source: "fresh"`, the second call within 60 seconds is `source: "cache"` — that is the demo working.

## Nginx returns 502 Bad Gateway
- Nginx is up but the app is not healthy yet. Wait a few seconds and retry: `curl http://localhost/health`
- Check: `docker compose logs nginx` and `docker compose logs app`

## Changes to the app do not appear
- You edited `app/src/server.js` but did not rebuild: `docker compose up -d --build`
- Or you are looking at a cached page — the app has no cache, Nginx does not cache here, so a rebuild is the usual cause.

## `docker compose` command not found
- Install Docker Engine + the Compose plugin (Docker Desktop on Windows/Mac includes both). On Ubuntu: `sudo apt install docker-compose-plugin` (or Docker Desktop). The old standalone `docker-compose` (with a hyphen) is deprecated — use `docker compose` (with a space).

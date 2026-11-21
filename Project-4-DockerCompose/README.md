# Project 4: Deploy Docker Containers Using Docker Compose

## Difficulty

- **Level:** 🟡 **Beginner to Intermediate**
- **Time to build:** 5–7 hours (including testing the full stack)
- **Prerequisite:** Project 2 (Docker — one container). This project is the next step: four containers, working together.

## Tools Required

- 🐳 **Docker** and **Docker Compose** (`docker compose`, with a space)
- 🟢 **Node.js** and **Express**
- 🍃 **MongoDB**
- ⚡ **Redis**
- 🌐 **Nginx**
- 🐧 **Linux** (or WSL / macOS for local testing)

## Project Overview

As applications grow, managing multiple Docker containers manually becomes difficult.

**Docker Compose** simplifies this process by allowing you to define and run multi-container applications using a single configuration file. Instead of starting each container individually, you can launch the entire application with one command:

```bash
docker compose up -d --build
```

This project runs a real multi-container stack:

```
Browser
  ↓ :80
Nginx (reverse proxy)
  ↓ app:3000
Node.js app (Express)
  ↓ mongo:27017        ↓ redis:6379
MongoDB (data)         Redis (cache)
```

## Example Application Stack

- 🟢 Node.js + Express — the application
- 🍃 MongoDB — persistent data (visit counter)
- ⚡ Redis — cache (60-second cached values)
- 🌐 Nginx — reverse proxy, the only service on port 80

## Repository Structure

```
Project-4-DockerCompose/
├── docker-compose.yml        # the whole stack: app, mongo, redis, nginx
├── .env.example              # copy to .env (never commit a real .env)
├── .gitignore
├── app/
│   ├── Dockerfile            # Node 22-alpine, non-root user, wget for healthcheck
│   ├── .dockerignore
│   ├── package.json
│   ├── src/server.js         # /, /health, /api/visits (Mongo), /api/cache (Redis)
│   └── tests/app.test.js     # node --test, no database needed
├── nginx/
│   └── nginx.conf            # reverse proxy to app:3000
├── mongo-init/
│   └── init.js               # creates the appuser on first start only
├── scripts/
│   ├── run.sh                # docker compose up -d --build + status
│   └── test.sh               # app tests + Compose YAML check (no Docker needed)
└── docs/
    ├── INTERVIEW-QUESTIONS.md
    └── TROUBLESHOOTING.md
```

## How It Works

| Service | Image | Port | What it does |
| --- | --- | --- | --- |
| `app` | built from `app/Dockerfile` | 3000 | Express app, `/`, `/health`, `/api/visits`, `/api/cache` |
| `mongo` | `mongo:7` | 27017 | Database, data in the `mongo_data` volume |
| `redis` | `redis:7-alpine` | 6379 | Cache, data in the `redis_data` volume |
| `nginx` | `nginx:alpine` | 80 | Reverse proxy to `app:3000` |

Services talk to each other by service name over the `app-network` network — the app connects to `mongo:27017` and `redis:6379`, Nginx proxies to `app:3000`. No IP addresses are hard-coded.

Healthchecks make the startup order real, not just hopeful:

- `mongo` is healthy when `mongosh ping` succeeds
- `redis` is healthy when `redis-cli ping` returns `PONG`
- `app` waits for both (`depends_on: condition: service_healthy`), and is healthy when `/health` answers
- `nginx` waits for the app to be healthy

The app also degrades gracefully: if Mongo or Redis is down, `/health` returns 503 `degraded` with each dependency's status, instead of the app crashing.

## Step-by-Step

### 1. Install Docker

- **Windows / macOS:** Install Docker Desktop (includes Compose).
- **Ubuntu:** Install Docker Engine + the Compose plugin. Check the current Docker docs for your version.
- Check it:
  ```bash
  docker --version
  docker compose version
  ```

### 2. Copy the environment file

```bash
cp .env.example .env
```

Change the passwords in `.env` before any shared or public use. If you change `MONGO_USER` / `MONGO_PASSWORD` / `MONGO_DB`, change them in `mongo-init/init.js` too — that script only runs once, on an empty volume.

### 3. Start the whole stack

```bash
docker compose up -d --build
# or: bash scripts/run.sh
```

### 4. Check the status

```bash
docker compose ps
docker compose logs -f app
```

All four services should show as healthy (it can take 10–20 seconds on first start while Mongo initialises).

### 5. Test it

```bash
# Through Nginx (port 80) — the normal way in:
curl http://localhost/
curl http://localhost/health

# Visit counter (MongoDB — the number goes up each time):
curl http://localhost/api/visits
curl http://localhost/api/visits

# Cache demo (Redis — first call "fresh", second call within 60s "cache"):
curl "http://localhost/api/cache?key=hello"
curl "http://localhost/api/cache?key=hello"

# Direct to the app (debugging only):
curl http://localhost:3000/health
```

### 6. Test the app without Docker

```bash
bash scripts/test.sh
# or, inside app/: npm install && npm test
```

The unit tests need no database — they only test `/` and the 404 route. The `/api/*` routes are exercised live, as in step 5.

### 7. Make a change and redeploy

Edit `app/src/server.js`, then rebuild only what changed:

```bash
docker compose up -d --build app
```

### 8. Stop it

```bash
docker compose down        # stops containers, keeps data volumes
docker compose down -v     # also deletes mongo_data + redis_data (all data!)
```

## Skills You'll Learn

- YAML Configuration
- Multi-Container Applications
- Environment Variables
- Persistent Storage (Volumes)
- Service-to-Service Communication
- Docker Networking
- Healthchecks and `depends_on: service_healthy`
- Reverse proxy with Nginx

## Resume Value

- Demonstrates experience with multi-container deployments.
- Shows understanding of Docker Compose and container orchestration basics.
- Prepares you for deploying modern web applications.
- The healthcheck / `depends_on` / graceful-degradation pattern is exactly what interviewers ask about after the basic "I ran `docker compose up`" answer. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `docker compose up -d --build` starts all 4 services
- [ ] `docker compose ps` shows all 4 healthy
- [ ] `curl http://localhost/` returns the project JSON
- [ ] `curl http://localhost/health` returns `{"status":"ok","mongo":"ok","redis":"ok"}`
- [ ] `/api/visits` increases on each call (MongoDB works, data persists after `docker compose down` + `up`)
- [ ] `/api/cache` returns `fresh` then `cache` (Redis works)
- [ ] `npm test` passes in `app/`
- [ ] Edit one line in the app, rebuild with `docker compose up -d --build app`, see the change
- [ ] No real `.env` committed — check `git status`

## Clean Up

```bash
docker compose down -v   # removes containers, network, volumes and data
docker image prune -f    # optional: remove unused images
```

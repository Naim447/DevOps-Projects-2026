# Interview Questions — Project 4 (Docker Compose)

## 1. What problem does Docker Compose solve?
Running one container is easy (`docker run`). Running a real app — Node + Mongo + Redis + Nginx — by hand means four `docker run` commands, with the right networks, volumes and environment variables each time. Compose describes all of it in one YAML file, and `docker compose up` starts the whole stack in the right order.

## 2. How do the services talk to each other?
Over the user-defined network `app-network`. Inside that network, each service is reachable by its service name as a DNS name: the app connects to `mongo:27017` and `redis:6379`, Nginx proxies to `app:3000`. They never need each other's IP addresses.

## 3. What is the difference between `depends_on` and a healthcheck?
`depends_on` only controls start order. Without a health condition, the app can start before Mongo is ready to accept connections and crash. Here `depends_on: condition: service_healthy` waits until Mongo's `mongosh ping` and Redis's `redis-cli ping` succeed. The app also handles a late database gracefully instead of crashing (see `/health`).

## 4. Why are Mongo and Redis data in volumes?
Containers are disposable — deleting a container deletes its filesystem. A named volume (`mongo_data`, `redis_data`) lives outside the container, so `docker compose down` and `up` again keeps the data. `docker compose down -v` is the command that deletes it — use it deliberately.

## 5. Why is Nginx in front of the app?
Nginx is the single entry point on port 80. It reverse-proxies to the app, sets `X-Forwarded-For` / `X-Real-IP` headers, and lets you add HTTPS, caching or rate-limiting later without changing the app. The app itself is only published on 3000 for debugging.

## 6. How do environment variables work here?
`.env` (copied from `.env.example`, never committed) supplies `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DB` and friends. Compose substitutes them with `${VAR:-default}`. The app reads `MONGO_URI` and `REDIS_URL` from its own environment — the same code runs locally and in Compose, only the variables change.

## 7. What is the difference between a Dockerfile and docker-compose.yml?
A Dockerfile builds **one** image (how to make the app container). Compose orchestrates **many** containers (which images, how they connect, volumes, ports, environment, healthchecks).

## 8. How do you scale the app?
`docker compose up --scale app=3 -d` — but only if the app is stateless (this one is: state lives in Mongo/Redis, not in the app container) and Nginx load-balances across the replicas. A single container name (`container_name: compose-app`) blocks scaling, so remove it before scaling in a real setup.

## 9. How do you debug a service that will not start?
`docker compose ps` (see which service is unhealthy), `docker compose logs app` / `logs mongo`, `docker compose exec app sh`, and `docker compose config` to see the final YAML after variable substitution.

## 10. What happens on `docker compose down` vs `down -v` vs `down --rmi all`?
`down` stops and removes containers and the network, but keeps volumes and images. `down -v` also deletes the named volumes (all Mongo/Redis data). `down --rmi all` also deletes the images. Know which one you mean before you run it.

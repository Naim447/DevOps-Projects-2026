# Project 9: Log Management with the ELK Stack

## Difficulty

- **Level:** 🟡 **Intermediate**
- **Time to build:** 5–7 hours (including learning Kibana basics)
- **Prerequisite:** Project 4 (Docker Compose) and Project 8 (monitoring). This project adds the other half of observability: logs.

## Tools Required

- 🔍 **Elasticsearch**
- 📥 **Logstash**
- 📊 **Kibana**
- 🐳 **Docker**
- 🟢 **Node.js**

## Project Overview

Effective log management is essential for troubleshooting and monitoring distributed systems.

Set up the **ELK Stack** to centralise, parse, search and visualise your application's logs.

## What You'll Learn

- Centralized logging
- Log parsing with Logstash
- Data visualization in Kibana
- Log searching with Kibana Query Language (KQL)
- Structured JSON logging

## Architecture

```
  Node.js app (port 3000)
    logs one JSON object per line
        | stdout (always) + TCP to Logstash :5000
        v
  Logstash — input: JSON over TCP
             filter: add environment, lowercase level
             output: Elasticsearch
        v
  Elasticsearch (port 9200) — index app-logs-YYYY.MM.dd
        v
  Kibana (port 5601) — Discover, search, dashboards
```

## Repository Structure

```
Project-9-ELK/
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── src/
│   │   ├── logger.js           # structured JSON logger (stdout + TCP to Logstash)
│   │   └── server.js           # /, /health, /api/visits, /api/search, /api/error
│   └── tests/app.test.js       # node --test, 4 tests (incl. logger JSON format)
├── logstash/pipeline/logstash.conf
├── docker-compose.yml          # app, elasticsearch, logstash, kibana
├── scripts/
│   ├── run.sh                  # up + where everything is
│   └── setup-kibana.sh         # create the app-logs-* data view via the Kibana API
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── .env.example
├── .gitignore
└── README.md
```

## ⚠️ Security Warning

This stack runs with Elasticsearch security **disabled** (`xpack.security.enabled=false`) and no Kibana login, so the lab works with no setup. That is **learning only** — never expose this to the internet, and never use it for real data. In production, enable security, use HTTPS, and set strong passwords.

## Step-by-Step

### 0. Machine requirements

Give Docker at least **4 GB of memory** (Docker Desktop → Settings → Resources). Elasticsearch alone needs 512 MB heap here.

On Linux, Elasticsearch may need this once:

```bash
sudo sysctl -w vm.max_map_count=262144
```

### 1. Test the app locally

```bash
cd app
npm install
npm test
npm start
# Logs are JSON lines on stdout, e.g.:
# {"timestamp":"...","level":"info","service":"project-9-app","message":"http_request","method":"GET","path":"/","status":200,"duration_ms":1.23}
```

Without Logstash running, the app still works — it logs to stdout and skips the TCP send.

### 2. Start the stack

```bash
docker compose up -d --build
# or: bash scripts/run.sh
docker compose ps
```

Elasticsearch takes 1–2 minutes on first start. Check it:

```bash
curl http://localhost:9200/
```

### 3. Generate logs

```bash
curl http://localhost:3000/api/search?q=docker
curl http://localhost:3000/api/search?q=kubernetes
curl http://localhost:3000/api/visits
curl http://localhost:3000/api/error
```

### 4. Check the logs reached Elasticsearch

```bash
curl "http://localhost:9200/app-logs-*/_count"
curl "http://localhost:9200/app-logs-*/_search?size=2&pretty"
```

### 5. Open Kibana and create the data view

Open http://localhost:5601/ (no login in this lab).

```bash
bash scripts/setup-kibana.sh
```

Or create it by hand: Stack Management → Data Views → Create → index pattern `app-logs-*`, time field `@timestamp`.

Then open **Discover** and try:

- `level: error` — the errors you created in step 3
- `message: search AND query: docker` — the search events
- `service: project-9-app` — everything from this app

### 6. Build a Kibana visualisation (optional, good for interviews)

Dashboard → Create → add a **Lens** bar chart: X-axis `@timestamp`, Y-axis count of documents, split by `level`. Save it as "App Logs by Level".

## Skills You'll Learn

- Elasticsearch (indexes, searching)
- Logstash (input / filter / output pipelines)
- Kibana (Discover, data views, KQL)
- Structured JSON logging
- Request tracing with `request_id`

## Resume Value

- Centralised logging is a standard DevOps responsibility, and ELK is the most commonly named stack for it.
- Being able to search for one request by its ID in Kibana — and explain why JSON logs make that possible — is a strong interview demo. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `npm test` passes locally in `app/`
- [ ] `docker compose up -d --build` succeeds, all 4 containers healthy
- [ ] `curl http://localhost:9200/app-logs-*/_count` returns a count greater than 0
- [ ] Kibana data view `app-logs-*` created, logs visible in Discover
- [ ] `level: error` search finds the errors from `/api/error`
- [ ] A search for `query: docker` finds the search events
- [ ] No real credentials committed (there are none in this project)

## Clean Up

```bash
docker compose down
# To delete stored logs too: docker compose down -v
```

---

*Project 9 of DevOps-Projects-2026. Project 8 answered "how many / how slow". This project answers "what happened for this one request".*

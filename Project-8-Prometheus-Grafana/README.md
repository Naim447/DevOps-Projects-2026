# Project 8: Monitoring and Alerting with Prometheus and Grafana

## Difficulty

- **Level:** 🟡 **Intermediate**
- **Time to build:** 5–7 hours (including learning PromQL basics)
- **Prerequisite:** Project 4 (Docker Compose). This project adds monitoring to a Compose stack.

## Tools Required

- 📊 **Prometheus**
- 📈 **Grafana**
- 🐳 **Docker**
- 🟢 **Node.js**

## Project Overview

Modern applications need monitoring to track performance and quickly identify problems.

Set up **Prometheus** and **Grafana** to monitor your Node.js app in real time.

## What You'll Learn

- Metrics collection with Prometheus
- Dashboard creation in Grafana
- Alerting rules in Prometheus
- Data visualization
- How to prove an alert works, on purpose

## Architecture

```
  Node.js app (port 3000)
    exposes /metrics (prom-client)
        |
        | Prometheus scrapes every 5s
        v
  Prometheus (port 9090) — stores time series, evaluates alerts
        |
        | Grafana queries with PromQL
        v
  Grafana (port 3001) — dashboard, admin / admin (lab default)
```

## Repository Structure

```
Project-8-Prometheus-Grafana/
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json            # express + prom-client
│   ├── src/server.js           # /, /health, /api/visits, /api/slow, /api/error, /metrics
│   └── tests/app.test.js       # node --test, 3 tests (incl. /metrics content)
├── prometheus/
│   ├── prometheus.yml          # scrape config: app every 5s
│   └── alerts.yml              # AppDown, HighErrorRate, HighLatency
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/default.yml
│   └── dashboards/node-app-dashboard.json
├── docker-compose.yml
├── scripts/run.sh
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── .env.example
├── .gitignore
└── README.md
```

## The App's Metrics

| Metric | Type | What it shows |
| --- | --- | --- |
| `http_requests_total` | Counter | Requests by method, route, status |
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `app_visits_total` | Counter | Visits to `/api/visits` |
| `process_*`, `nodejs_*` | Default | CPU, memory, event loop, GC |

## Step-by-Step

### 1. Test the app locally

```bash
cd app
npm install
npm test
npm start
# curl http://localhost:3000/metrics | grep http_requests_total
```

### 2. Start the stack

```bash
docker compose up -d --build
# or: bash scripts/run.sh
docker compose ps
```

### 3. Generate some traffic

```bash
curl http://localhost:3000/api/visits
curl http://localhost:3000/api/slow
curl http://localhost:3000/api/error
```

### 4. Check Prometheus

Open http://localhost:9090/

- **Status → Targets:** `node-app` should be UP.
- Try a query: `sum(rate(http_requests_total[1m])) by (route)`
- **Status → Rules:** the 3 alert rules, and **Alerts** to see their state.

### 5. Open the Grafana dashboard

Open http://localhost:3001/ — log in with `admin` / `admin` (change the password when asked).

Dashboards → **Node App — Project 8**: request rate, p95 latency, 5xx error rate, app memory, total visits.

### 6. Trigger an alert on purpose

```bash
# High error rate: hit the error endpoint a few times
for i in 1 2 3 4 5; do curl -s http://localhost:3000/api/error > /dev/null; done
# Then check Prometheus → Alerts after about a minute.

# App down: stop the app and watch AppDown fire after 30s
docker compose stop app
docker compose start app
```

## Skills You'll Learn

- Prometheus (scrape config, PromQL, alert rules)
- Grafana (provisioned datasource + dashboard)
- Metrics design (Counter / Gauge / Histogram)
- Monitoring a real app end to end

## Resume Value

- Monitoring is a core DevOps responsibility, and Prometheus + Grafana is the most common open-source monitoring stack in job descriptions.
- Being able to trigger an alert on purpose — and explain the PromQL behind it — is a strong interview demo. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `npm test` passes locally in `app/`
- [ ] `docker compose up -d --build` succeeds, all 3 containers healthy
- [ ] Prometheus → Status → Targets shows `node-app` UP
- [ ] Grafana dashboard shows data after generating traffic
- [ ] Each alert triggered on purpose at least once
- [ ] Grafana admin password changed from the lab default
- [ ] No real credentials committed

## Clean Up

```bash
docker compose down
# To delete stored metrics and dashboards too: docker compose down -v
```

---

*Project 8 of DevOps-Projects-2026. Project 4 ran the stack; this project watches it. Project 9 adds the other half of observability: logs.*

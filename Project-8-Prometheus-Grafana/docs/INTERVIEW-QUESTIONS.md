# Interview Questions — Project 8 (Prometheus & Grafana)

## 1. What is Prometheus, in one sentence?
A monitoring system that **pulls** numeric metrics from your services over HTTP (`/metrics`), stores them as time series, and lets you query them with PromQL.

## 2. Push vs pull — how does Prometheus collect metrics?
Pull: Prometheus scrapes targets on a schedule (here every 5s for the app). Push is only for short-lived jobs, via the Pushgateway. Pull means a dead target is visible immediately — the `up` metric goes to 0, which is exactly what the `AppDown` alert uses.

## 3. Counter vs Gauge vs Histogram?
- **Counter** — only goes up (total requests, total visits). Use `rate()` to get requests per second.
- **Gauge** — goes up and down (memory usage, in-flight requests).
- **Histogram** — a distribution of observed values (request latency), so you can calculate percentiles like p95. This project uses all three: a Counter for requests, a Histogram for latency, and default Gauges for memory.

## 4. What is PromQL? Give an example.
Prometheus Query Language. Examples from this project:
- Request rate: `sum(rate(http_requests_total[1m])) by (route)`
- Error rate: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- p95 latency: `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`

## 5. What does Grafana do that Prometheus does not?
Prometheus stores and queries the data; Grafana visualises it. Grafana is a dashboard layer that can talk to many data sources (Prometheus, Elasticsearch, CloudWatch). The dashboard here is provisioned as code, so it appears automatically.

## 6. How does an alert work here?
An alert rule in `prometheus/alerts.yml` is an expression plus a `for:` duration. `AppDown` fires when `up{job="node-app"} == 0` for 30 seconds. There is no Alertmanager in this learning setup, so alerts show in the Prometheus UI — add Alertmanager to send them to Slack or email.

## 7. How do you trigger each alert on purpose?
- **AppDown:** `docker compose stop app` — wait 30s, check Prometheus → Alerts.
- **HighErrorRate:** hit `curl http://localhost:3000/api/error` several times.
- **HighLatency:** hit `curl http://localhost:3000/api/slow` several times (each takes ~0.8s).

## 8. Why is the dashboard provisioned as files, not built by clicking?
Because it is versioned in Git, reviewed like code, and recreated automatically on `docker compose up`. The datasource and the dashboard provider are both in `grafana/provisioning/`.

## 9. What are the default metrics, and why keep them?
`prom-client`'s `collectDefaultMetrics()` adds process and Node runtime metrics — CPU, memory, event-loop lag, GC. They cost nothing and are what you check first when an app is slow or leaking memory.

## 10. Metrics vs logs — when do you use each?
Metrics answer "how many / how slow / how many errors" over time and drive alerts and dashboards. Logs answer "what happened for this one request" — that is Project 9 (ELK). You need both; neither replaces the other.

# Interview Questions — Project 9 (ELK Stack)

## 1. What is the ELK Stack, and what does each part do?
- **Elasticsearch** — a search engine / document store. Logs become searchable JSON documents, indexed by date.
- **Logstash** — a pipeline: takes logs in (here, JSON over TCP), filters / enriches them, sends them out to Elasticsearch.
- **Kibana** — the visualisation layer: search logs in Discover, build dashboards, set up alerts.

## 2. Why structured JSON logging instead of plain text?
Plain text needs a parsing rule (grok) for every format, and breaks when someone changes the wording. JSON logs arrive already parsed — `level`, `service`, `message`, `request_id` are fields you can filter and aggregate on directly in Kibana. That is why `app/src/logger.js` emits one JSON object per line.

## 3. How does a log get from the app to Kibana?
App → TCP (port 5000, JSON lines) → Logstash input → filter (adds `environment`, lowercases `level`) → Elasticsearch index `app-logs-YYYY.MM.dd` → Kibana data view `app-logs-*` → Discover / dashboards.

## 4. Why is the index named `app-logs-YYYY.MM.dd`?
One index per day keeps indexes small, makes old logs easy to delete (delete yesterday's index, not rows in a giant table), and lets Elasticsearch drop old data with ILM (Index Lifecycle Management) later.

## 5. How do you find all errors in the last hour?
In Kibana Discover, select the `app-logs-*` data view, set the time range to the last hour, and search `level: error`. To create errors on purpose: `curl http://localhost:3000/api/error` a few times.

## 6. How do you trace one request across services?
By `request_id`: the app generates a UUID per request and logs it on every line for that request. In a microservices setup, the same ID is passed along in a header, so you can search `request_id: <id>` in Kibana and see the whole journey.

## 7. What is the difference between Logstash and Filebeat?
Logstash is a full pipeline (input, filter, output) that runs as a service and can transform logs. Filebeat is a lightweight shipper that reads log files and forwards them — often to Logstash or directly to Elasticsearch. In this project the app sends logs to Logstash directly over TCP, so no Filebeat is needed; in a real setup, Filebeat would collect logs from containers' files.

## 8. Metrics (Project 8) vs logs (Project 9) — when do you use each?
Metrics answer "how many / how slow / how many errors" over time and drive alerts. Logs answer "what happened for this one request". A Prometheus alert tells you the error rate rose; Kibana tells you which requests failed and why. You need both.

## 9. Why is security disabled in this stack?
`xpack.security.enabled=false` and no Kibana login, so the lab works with no setup. Say clearly in an interview that this is **learning only** — in production you enable security, use HTTPS, and set strong passwords for the `elastic` user. Never run an open Elasticsearch on the internet.

## 10. What would you change for production?
Enable Elasticsearch security and TLS, use Filebeat to collect container logs (instead of relying on the app to send them), add ILM policies to delete old indexes, run 3 Elasticsearch nodes instead of 1, and back up with snapshots.

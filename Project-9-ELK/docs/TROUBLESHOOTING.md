# Troubleshooting — Project 9

## Elasticsearch will not start / exits immediately
- Elasticsearch needs at least 512 MB heap here (`ES_JAVA_OPTS=-Xms512m -Xmx512m`) and enough memory on the machine. Give Docker Desktop at least 4 GB.
- Check the logs: `docker compose logs elasticsearch`
- On Linux, Elasticsearch may need `vm.max_map_count` raised: `sudo sysctl -w vm.max_map_count=262144` (see the README).

## Kibana shows "Elasticsearch is not available"
- Elasticsearch takes 1–2 minutes on first start. Check it directly: `curl http://localhost:9200/` — it should return a JSON document with the cluster name.
- Check health: `docker compose ps` — wait until elasticsearch is `healthy` before Kibana finishes starting.

## No logs in Kibana Discover
- Check logs are reaching Elasticsearch: `curl "http://localhost:9200/app-logs-*/_count"`
- If the count is 0, check Logstash received them: `docker compose logs logstash`
- Generate logs first: `curl http://localhost:3000/api/search?q=docker` and `curl http://localhost:3000/api/error`
- Check the data view exists and is selected: `bash scripts/setup-kibana.sh`, then in Discover pick the `App Logs` data view and a time range that includes now (default is the last 15 minutes).

## `setup-kibana.sh` fails: 409 Conflict
- The data view already exists. That is fine — open Kibana and use it. To recreate it, delete it in Kibana first (Stack Management → Data Views).

## App logs show in `docker compose logs app` but not in Logstash
- The app sends logs to Logstash only when `LOGSTASH_HOST` is set (it is, in `docker-compose.yml`). If Logstash was not ready when the app started, the app's TCP connection fails once and does not retry — restart the app: `docker compose restart app`
- The stdout logs are never lost: they are always in `docker compose logs app`.

## Port already in use (3000, 5000, 9200 or 5601)
- Something else is using that port (maybe another project, or a local Elasticsearch). Stop it, or change the host port in `docker-compose.yml` (the left side of `9200:9200`).

## `docker compose up` is very slow / the machine runs out of disk
- The ELK images are large (Elasticsearch + Logstash + Kibana together are several GB). The first pull takes a while.
- Clean up when done: `docker compose down -v` removes the Elasticsearch data volume.

# Troubleshooting — Project 8

## Prometheus shows the app target as DOWN
- Check the app is running: `docker compose ps` and `curl http://localhost:3000/metrics`
- Prometheus scrapes `app:3000` — that hostname only exists inside the Compose network. Do not change it to `localhost` in `prometheus.yml`; `localhost` inside the Prometheus container is Prometheus itself.

## Grafana shows "No data" on every panel
- Check the datasource: Grafana → Connections → Data sources → Prometheus → Save & test. It must point at `http://prometheus:9090`.
- Generate traffic first: `curl http://localhost:3000/api/visits` a few times, then wait 15–30s for the next scrape.
- Check the time range in the top-right of the dashboard — it defaults to the last 6 hours, so new data should be visible.

## Dashboard did not appear in Grafana
- Check the provisioning files are mounted: `docker compose exec grafana ls /etc/grafana/provisioning/dashboards/`
- Check Grafana logs: `docker compose logs grafana`
- Restart Grafana after changing provisioning files: `docker compose restart grafana`

## Grafana login fails
- Default lab login is `admin` / `admin`. If you changed it and forgot it, remove the volume and start again: `docker compose down -v` (this also deletes Prometheus data).

## Alerts never fire
- Alerts need data: generate traffic, then wait for the `for:` duration (30s for AppDown, 1m for the others).
- Check Prometheus → Status → Rules to see if the rules loaded. If the page is empty, check `prometheus/alerts.yml` is mounted: `docker compose exec prometheus ls /etc/prometheus/`

## Prometheus will not start: "permission denied" on /prometheus
- The named volume is owned by root on first creation. Fix it once: `docker compose down -v && docker compose up -d` — or, on Linux, `chown 65534:65534` on the volume. This is a known Prometheus-on-Docker quirk.

## Port already in use (3000, 9090 or 3001)
- Something else is using that port (maybe another project). Stop it, or change the host port in `docker-compose.yml` (the left side of `3000:3000`).

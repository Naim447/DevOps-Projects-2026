#!/usr/bin/env bash
# Start the whole stack, then print where everything is.
# Usage: bash scripts/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d --build
docker compose ps
echo
echo "App:        http://localhost:3000/  (try /api/visits, /api/slow, /api/error)"
echo "Prometheus: http://localhost:9090/  (Status -> Targets, then Alerts)"
echo "Grafana:    http://localhost:3001/  (admin / admin — change it first time)"
echo "Stop with:  docker compose down"

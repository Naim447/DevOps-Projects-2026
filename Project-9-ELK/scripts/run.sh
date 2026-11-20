#!/usr/bin/env bash
# Start the whole ELK stack, then print where everything is.
# Usage: bash scripts/run.sh
# Note: Elasticsearch takes 1-2 minutes on first start. Be patient.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d --build
docker compose ps
echo
echo "App:            http://localhost:3000/  (try /api/search?q=docker, /api/error)"
echo "Elasticsearch:  http://localhost:9200/"
echo "Kibana:         http://localhost:5601/  (no login — security is off for this lab)"
echo "Create the data view with: bash scripts/setup-kibana.sh"
echo "Stop with:      docker compose down"

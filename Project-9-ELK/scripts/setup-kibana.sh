#!/usr/bin/env bash
# Create the Kibana data view for app logs, via the Kibana API.
# Run after the stack is up and a few logs exist (see README step 5).
# Usage: bash scripts/setup-kibana.sh
set -euo pipefail
KIBANA="${KIBANA_URL:-http://localhost:5601}"

echo "Waiting for Kibana to be ready..."
for attempt in $(seq 1 30); do
  if curl --fail --silent "$KIBANA/api/status" > /dev/null; then
    break
  fi
  sleep 5
done

curl --fail --silent -X POST "$KIBANA/api/data_views/data_view" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{"data_view": {"title": "app-logs-*", "name": "App Logs", "timeFieldName": "@timestamp"}}'

echo
echo "Data view 'App Logs' (app-logs-*) created. Open Discover in Kibana to see the logs."

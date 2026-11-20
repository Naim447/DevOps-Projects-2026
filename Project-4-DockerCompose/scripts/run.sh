#!/usr/bin/env bash
# Start the whole stack: docker compose up -d --build, then show status.
# Usage: bash scripts/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || cp .env.example .env
docker compose up -d --build
docker compose ps
echo
echo "Open http://localhost/  (through Nginx)"
echo "Direct app: http://localhost:3000/"
echo "Health: curl http://localhost/health"

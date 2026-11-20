#!/usr/bin/env bash
# Local checks only — no Docker needed for the app tests.
# Usage: bash scripts/test.sh
set -euo pipefail
cd "$(dirname "$0")/../app"
npm install
npm test
cd ..
python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml')); print('docker-compose.yml: YAML OK')"

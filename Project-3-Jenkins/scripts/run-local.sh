#!/usr/bin/env bash
# Run the app locally without Jenkins or Docker — for a quick test.
# Usage: bash scripts/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
npm install
npm test
PORT=3000 npm start

#!/usr/bin/env bash
# Local checks — no AWS credentials needed for fmt / validate
# (validate needs terraform init first; init needs no credentials).
# Usage: bash scripts/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
terraform fmt -check -recursive
echo "fmt OK"
terraform init -backend=false -input=false
terraform validate
echo "validate OK"

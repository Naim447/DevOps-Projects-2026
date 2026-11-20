#!/usr/bin/env bash
# One-command deploy: syntax check -> dry run -> deploy -> health check.
# Run from the project root:  bash scripts/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1. Syntax check =="
ansible-playbook playbooks/site.yml --syntax-check

echo "== 2. Dry run (nothing changes) =="
ansible-playbook playbooks/site.yml --check --diff

echo "== 3. Deploy =="
ansible-playbook playbooks/site.yml

echo "== 4. Health check =="
ansible-playbook playbooks/health-check.yml

echo "Done. Open http://$(grep -m1 ansible_host inventory/hosts.ini | sed 's/.*ansible_host=//;s/ .*//') in a browser."

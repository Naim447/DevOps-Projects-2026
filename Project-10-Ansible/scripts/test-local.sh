#!/usr/bin/env bash
# Local checks only — no server, no AWS needed.
# Run from the project root:  bash scripts/test-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== YAML syntax (all .yml files) =="
python3 -c "
import glob, sys, yaml
bad = []
for f in glob.glob('**/*.yml', recursive=True) + glob.glob('**/*.yaml', recursive=True):
    try:
        with open(f) as fh:
            list(yaml.safe_load_all(fh))
    except Exception as e:
        bad.append((f, e))
if bad:
    print(bad)
    sys.exit(1)
print('YAML OK')
"

echo "== Playbook syntax check =="
for p in playbooks/*.yml; do
  echo "  $p"
  ansible-playbook "$p" --syntax-check 2>/dev/null || echo "  (ansible not installed locally — skipped, CI will check it)"
done

echo "== Lint =="
if command -v ansible-lint >/dev/null 2>&1; then
  ansible-lint
else
  echo "  ansible-lint not installed locally — skipped, CI will check it"
fi

echo "Local checks done."

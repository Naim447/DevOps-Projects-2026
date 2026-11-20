#!/usr/bin/env bash
# Local checks only — no cluster needed.
# Usage: bash scripts/test-local.sh
set -euo pipefail
cd "$(dirname "$0")/../app"
npm install
npm test
cd ..
python3 -c "
import glob, yaml
for f in sorted(glob.glob('k8s/*.yaml')):
    docs = list(yaml.safe_load_all(open(f)))
    print(f, '->', [d.get('kind') for d in docs if d])
print('K8s YAML OK')
"
# kustomize build is the client-side check that works without a cluster.
# (kubectl apply --dry-run=client still needs an API server, so it is
# not used here — the real apply is tested in scripts/deploy.sh.)
if command -v kubectl >/dev/null 2>&1; then
  kubectl kustomize k8s/ > /dev/null
  echo "kustomize build OK"
else
  echo "kubectl not installed locally — kustomize check skipped (Minikube will check it)"
fi

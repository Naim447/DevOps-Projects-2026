#!/usr/bin/env bash
# Remove everything this project created from the cluster.
# Usage: bash scripts/cleanup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
kubectl delete -k k8s/ --ignore-not-found
kubectl delete namespace project-5 --ignore-not-found
echo "Cleaned up. To stop Minikube as well: minikube stop"

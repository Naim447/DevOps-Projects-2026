#!/usr/bin/env bash
# Deploy the app to Minikube (local Kubernetes).
# Usage: bash scripts/deploy.sh
# Before the first run, replace YOUR_DOCKERHUB_USERNAME in
# k8s/deployment.yaml with your real Docker Hub username.
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE="${DOCKERHUB_USERNAME:-YOUR_DOCKERHUB_USERNAME}/k8s-node-app:latest"

echo "== 1. Start Minikube (skip if already running) =="
minikube start --driver=docker --cpus=2 --memory=4096 || true

echo "== 2. Build the image =="
docker build -t "$IMAGE" ./app

echo "== 3. Load the image into Minikube (so no push is needed) =="
minikube image load "$IMAGE"

echo "== 4. Apply the manifests =="
kubectl apply -k k8s/

echo "== 5. Wait for the rollout =="
kubectl rollout status deployment/k8s-node-app -n project-5

echo "== 6. Status =="
kubectl get pods,svc,ingress,hpa -n project-5

echo
echo "Access it with:"
echo "  minikube service k8s-node-app-nodeport -n project-5 --url"
echo "Or port-forward:"
echo "  kubectl port-forward svc/k8s-node-app 8080:80 -n project-5"
echo "  curl http://localhost:8080/"

# Project 5: Kubernetes Deployment Project

## Difficulty

- **Level:** 🟡 **Beginner to Intermediate**
- **Time to build:** 6–8 hours (including Minikube setup and testing)
- **Prerequisite:** Project 2 (Docker — one container) and Project 4 (Docker Compose). Kubernetes runs the containers you already know how to build.

## Tools Required

- ☸️ **Kubernetes**
- 📦 **Minikube**
- 🐳 **Docker**
- 🖥️ **kubectl**

## Project Overview

After learning Docker, the next step is **Kubernetes**, the industry-standard platform for managing containerized applications.

Kubernetes automatically deploys, scales, and manages containers while ensuring applications remain available even during failures.

This project deploys a Node.js app on a local Minikube cluster with:

- **3 replicas** — if one Pod dies, the others keep serving
- **Deployment** — rolling updates and rollbacks
- **Service** — ClusterIP (internal) + NodePort (lab access)
- **ConfigMap + Secret** — configuration and (example) sensitive data, as environment variables
- **Ingress** — host-based routing (`k8s-app.local`)
- **HPA** — autoscaling from 2 to 5 replicas on CPU

## What You'll Learn

- Pods
- ReplicaSets
- Deployments
- Services
- ConfigMaps
- Secrets
- Ingress and HorizontalPodAutoscaler (HPA)
- Liveness and readiness probes
- Rolling updates and self-healing

## Repository Structure

```
Project-5-Kubernetes/
├── app/
│   ├── Dockerfile            # Node 22-alpine, non-root user
│   ├── .dockerignore
│   ├── package.json
│   ├── src/server.js         # /, /health, /api/info (returns its Pod name)
│   └── tests/app.test.js     # node --test, 3 tests
├── k8s/
│   ├── namespace.yaml        # project-5 namespace
│   ├── configmap.yaml        # NODE_ENV, APP_VERSION, APP_MESSAGE
│   ├── secret.yaml           # API_KEY (example value only)
│   ├── deployment.yaml       # 3 replicas, probes, resources, rolling update
│   ├── service.yaml          # ClusterIP + NodePort (30080)
│   ├── ingress.yaml          # k8s-app.local -> app Service
│   ├── hpa.yaml              # 2-5 replicas, CPU 70%
│   └── kustomization.yaml    # kubectl apply -k k8s/
├── scripts/
│   ├── deploy.sh             # minikube start -> build -> load -> apply -> status
│   ├── cleanup.sh            # delete everything this project created
│   └── test-local.sh         # app tests + K8s YAML check (no cluster needed)
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── .gitignore
└── README.md
```

## How It Works

```
kubectl apply -k k8s/
        ↓
Namespace project-5
        ↓
Deployment (3 replicas)
  Pod 1 ─┐
  Pod 2 ─┼─► Service (ClusterIP :80)
  Pod 3 ─┘        ↓
             NodePort :30080 / Ingress k8s-app.local
        ↓
  Browser / curl
```

Each Pod answers `/` with its own Pod name (`HOSTNAME` in the container), so calling the Service repeatedly shows the traffic moving between replicas.

## Step-by-Step

### 1. Install the tools

- **Docker Desktop** (Windows / macOS) or Docker Engine (Linux) — Minikube uses it as its driver.
- **Minikube:** https://minikube.sigs.k8s.io/docs/start/
- **kubectl:** https://kubernetes.io/docs/tasks/tools/ (or the version bundled with Minikube / Docker Desktop)

Check them:

```bash
docker --version
minikube version
kubectl version --client
```

### 2. Test the app locally (no cluster needed)

```bash
bash scripts/test-local.sh
# or, inside app/: npm install && npm test
```

### 3. Build the image and deploy

Replace `YOUR_DOCKERHUB_USERNAME` in `k8s/deployment.yaml` with your real Docker Hub username first.

Then run the deploy script, or do it step by step:

```bash
bash scripts/deploy.sh
```

Step by step:

```bash
minikube start --driver=docker --cpus=2 --memory=4096

docker build -t YOUR_DOCKERHUB_USERNAME/k8s-node-app:latest ./app
minikube image load YOUR_DOCKERHUB_USERNAME/k8s-node-app:latest

kubectl apply -k k8s/
kubectl rollout status deployment/k8s-node-app -n project-5
kubectl get pods,svc,ingress,hpa -n project-5
```

### 4. Access the app

```bash
minikube service k8s-node-app-nodeport -n project-5 --url
# or port-forward (works everywhere):
kubectl port-forward svc/k8s-node-app 8080:80 -n project-5
curl http://localhost:8080/
```

Call `/` several times and watch the `pod` field change — that is load-balancing across the 3 replicas.

```bash
curl http://localhost:8080/api/info
curl http://localhost:8080/health
```

### 5. Prove self-healing (the interview demo)

```bash
# Pick one Pod and delete it:
kubectl get pods -n project-5
kubectl delete pod <pod-name> -n project-5

# Watch a replacement appear, with no downtime on the Service:
kubectl get pods -n project-5 -w
curl http://localhost:8080/health
```

### 6. Prove scaling

```bash
kubectl scale deployment k8s-node-app -n project-5 --replicas=5
kubectl get pods -n project-5
kubectl scale deployment k8s-node-app -n project-5 --replicas=3
```

### 7. Prove a rolling update

Change `APP_VERSION` in `k8s/configmap.yaml` from `v1` to `v2`, then:

```bash
kubectl apply -k k8s/
kubectl rollout status deployment/k8s-node-app -n project-5
kubectl rollout history deployment/k8s-node-app -n project-5
# Roll back if you need to:
kubectl rollout undo deployment/k8s-node-app -n project-5
```

Note: a ConfigMap change alone does not restart Pods — the rollout above restarts them because the Deployment is re-applied. In a real setup, use a versioned ConfigMap or a tool like Reloader for that.

### 8. Ingress (optional)

```bash
minikube addons enable ingress
# Add this line to your hosts file, with the Minikube IP:
#   <minikube-ip>  k8s-app.local
curl -H "Host: k8s-app.local" http://$(minikube ip)/
```

## Skills You'll Gain

- Kubernetes Architecture
- Container Orchestration
- Application Scaling
- Self-Healing Applications
- Service Discovery
- ConfigMaps and Secrets
- Probes, rolling updates and autoscaling

## Resume Value

- Demonstrates practical Kubernetes knowledge.
- Highly valued skill for DevOps, Cloud, and Platform Engineering roles.
- One of the most important beginner Kubernetes projects.
- The self-healing and rolling-update demos are what interviewers remember — run them live. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `bash scripts/test-local.sh` passes (3 app tests, K8s YAML valid)
- [ ] `kubectl apply -k k8s/` succeeds, `kubectl rollout status` shows the Deployment ready
- [ ] `kubectl get pods -n project-5` shows 3 Running Pods
- [ ] `curl` through the NodePort / port-forward returns the project JSON
- [ ] Calling `/` repeatedly shows different `pod` names (load-balancing)
- [ ] Deleting one Pod creates a replacement automatically (self-healing)
- [ ] Scaling to 5 and back to 3 works
- [ ] Rolling update to `v2` and rollback work
- [ ] No real secret committed — `secret.yaml` holds only the example value

## Clean Up

```bash
bash scripts/cleanup.sh
minikube stop
# To remove the cluster completely: minikube delete
```

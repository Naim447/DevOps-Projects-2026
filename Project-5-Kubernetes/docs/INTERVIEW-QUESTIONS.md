# Interview Questions — Project 5 (Kubernetes)

## 1. What is Kubernetes, in one sentence?
An orchestrator that runs containers across a cluster, keeps the desired number of them alive, and routes traffic to them — you declare the desired state, Kubernetes makes it real and keeps it real.

## 2. Pod vs Deployment vs ReplicaSet vs Service?
- **Pod** — the smallest unit: one or more containers that share a network and storage, scheduled together.
- **ReplicaSet** — keeps a fixed number of identical Pods running.
- **Deployment** — manages a ReplicaSet and adds rolling updates and rollbacks. You almost never create a ReplicaSet directly.
- **Service** — a stable virtual IP / DNS name in front of a set of Pods, so traffic does not depend on Pod IPs that change.

## 3. How does self-healing work here?
The Deployment wants 3 replicas. Delete a Pod (`kubectl delete pod <name> -n project-5`) and the ReplicaSet creates a replacement. If a container fails its liveness probe (`/health` stops answering), kubelet restarts that container. Prove it live in the demo.

## 4. Liveness probe vs readiness probe?
- **Readiness** (`/health`, 5s delay): "is this Pod ready for traffic?" A Pod that is not ready is removed from the Service endpoints, but not restarted.
- **Liveness** (`/health`, 10s delay): "is this Pod alive?" A failing liveness probe restarts the container.
Getting them mixed up — e.g. a slow-starting app with a too-short liveness delay — causes restart loops.

## 5. What is a ConfigMap? A Secret? When do you use each?
- **ConfigMap** — non-sensitive configuration (here: `NODE_ENV`, `APP_VERSION`, `APP_MESSAGE`). Mounted as environment variables with `envFrom`.
- **Secret** — sensitive data (here: `API_KEY`, example value only). Same mechanism, but base64-encoded by Kubernetes and not shown in plain text in `kubectl get`. Neither is encryption at rest by default — say that, and mention Sealed Secrets / external secret managers for production.

## 6. ClusterIP vs NodePort vs LoadBalancer vs Ingress?
- **ClusterIP** — internal only, the default.
- **NodePort** — exposes the Service on a port on every node (here 30080), for lab access.
- **LoadBalancer** — asks the cloud provider for a real load balancer (AWS ELB, etc.).
- **Ingress** — an HTTP router in front of many Services, by host/path (here `k8s-app.local` → the app Service). Ingress needs an ingress controller installed.

## 7. How does a rolling update work?
Change the image tag in the Deployment and apply it. Kubernetes creates new Pods one by one (`maxSurge: 1`) and removes old ones (`maxUnavailable: 1`), so the Service keeps serving throughout. If it goes wrong: `kubectl rollout undo deployment/k8s-node-app -n project-5`.

## 8. What does the HPA do?
The HorizontalPodAutoscaler watches CPU utilisation (target 70%) and scales the Deployment between 2 and 5 replicas. It needs resource requests set (they are, in the Deployment) and the metrics server installed in the cluster.

## 9. Why does the app return its Pod name?
So you can see load-balancing: call `/` several times through the Service and watch the `pod` field change between the 3 replicas. It turns an abstract idea into something visible.

## 10. Minikube vs a real cluster?
Minikube runs a single-node cluster on your laptop — perfect for learning. Production is a multi-node managed cluster (EKS, AKS, GKE). The manifests here are the same; only the cluster, the image registry and the Ingress/LoadBalancer setup change.

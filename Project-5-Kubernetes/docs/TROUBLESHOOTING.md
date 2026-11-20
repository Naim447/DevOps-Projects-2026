# Troubleshooting — Project 5

## `kubectl apply` fails: ImagePullBackOff / ErrImagePull
- The image name still has `YOUR_DOCKERHUB_USERNAME` in it. Replace it in `k8s/deployment.yaml`.
- Or you did not load the image into Minikube: `minikube image load <image>` then `kubectl rollout restart deployment/k8s-node-app -n project-5`
- Check the image exists: `docker images | grep k8s-node-app`

## Pods are Pending
- Minikube may be out of CPU / memory. Check: `kubectl describe pod <name> -n project-5`
- Restart Minikube with more resources: `minikube start --driver=docker --cpus=2 --memory=4096`

## Pods are CrashLoopBackOff
- Check the logs: `kubectl logs <pod> -n project-5`
- Common cause: the app crashed on start (check `npm test` locally first) or the liveness probe is too aggressive for a slow start.

## Service returns 503 / no endpoints
- Check the Pods are Ready: `kubectl get pods -n project-5`
- A Pod that fails its readiness probe is removed from the Service. Check: `kubectl describe pod <name> -n project-5` and `kubectl get endpoints k8s-node-app -n project-5`
- Check the Service selector matches the Pod labels: both must be `app: k8s-node-app`.

## `minikube service ... --url` does not open
- The NodePort Service is `k8s-node-app-nodeport`, port 30080. Use that Service name, not the ClusterIP one.
- Or use port-forward instead: `kubectl port-forward svc/k8s-node-app 8080:80 -n project-5`, then `curl http://localhost:8080/`

## Ingress returns 404
- Enable the Ingress controller: `minikube addons enable ingress`
- Add `k8s-app.local` to your hosts file pointing at the Minikube IP (`minikube ip`), or test with: `curl -H "Host: k8s-app.local" http://$(minikube ip)/`

## HPA shows `<unknown>` for CPU
- The metrics server is not installed. Enable it: `minikube addons enable metrics-server`, wait a minute, then `kubectl get hpa -n project-5`

## `kubectl` command not found
- Install kubectl from the official Kubernetes docs, or use the one bundled with Minikube / Docker Desktop. The manifests here only need `kubectl apply`, `get`, `logs`, `describe` and `rollout`.

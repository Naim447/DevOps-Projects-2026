# Troubleshooting — Project 3

## Jenkins page does not open on port 8080
- Check the EC2 security group allows TCP 8080 from **your IP only**.
- Check Jenkins is running: `sudo systemctl status jenkins --no-pager`
- Check you are using the public IP/DNS, not the private IP.
- Never expose 8080 to `0.0.0.0/0`. Jenkins is an administrative service.

## `sudo -u jenkins -H docker version` fails
- The `jenkins` user was added to the `docker` group, but the group change needs a Jenkins restart: `sudo systemctl restart jenkins`
- Check membership: `id jenkins`
- Check Docker: `sudo systemctl status docker --no-pager` and `sudo journalctl -u jenkins -n 100 --no-pager`

## Pipeline fails at Test
- Run the tests locally first: `npm install && npm test`
- The tests use Node's built-in test runner (`node --test`) and need Node 18+. Jenkins runs them on the EC2 host, so Node must be installed there, or the stage must run inside a Node container.

## Pipeline fails at Push to Docker Hub
- Check the credential ID is exactly `dockerhub-creds` in Manage Jenkins → Credentials.
- Check the Docker Hub repository exists, e.g. `jenkins-node-app`.
- Check the credential holds a Docker Hub **access token**, not your account password, and that the token has push permission.
- Check `IMAGE_NAME` in the Jenkinsfile uses your real Docker Hub username, not `YOUR_DOCKERHUB_USERNAME`.

## Pipeline fails at Verify Deployment
- Run `docker logs jenkins-node-app` on the EC2 — the app logs show the real error.
- Check nothing else is already using port 3000: `sudo ss -tlnp | grep 3000`
- Check the container is actually running: `docker ps -a`

## EC2 runs out of memory / disk
- Jenkins + Docker builds need more memory than a very small instance. Use a larger instance type for this lab.
- Clean old images: `docker image prune -a -f` (the pipeline already prunes after each run).
- Check disk: `df -h` and Jenkins logs in `/var/lib/jenkins/logs/`.

## `npm install` is slow or fails on EC2
- Check the EC2 has internet access (NAT / public subnet, security group outbound allowed).
- Do not commit `node_modules/` — it is in `.gitignore` and `.dockerignore`.

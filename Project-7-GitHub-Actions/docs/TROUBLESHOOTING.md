# Troubleshooting — Project 7

## Workflow does not run at all
- Check the workflow file is at `.github/workflows/ci-cd.yml` on the `main` branch (not only on your laptop).
- Check Actions are enabled: repo → Settings → Actions → General.
- A workflow only runs on the branches in its `on:` block (`main` here).

## Build job fails at "Run tests"
- Run the tests locally first: `cd app && npm install && npm test`
- If `npm ci` fails, `package-lock.json` is out of sync: run `npm install` locally, commit the updated lock file, and push again.

## Deploy job fails at "Log in to Docker Hub"
- Check the secrets exist with exactly these names: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
- Check the token is a Docker Hub **access token** with push permission, and that the Docker Hub repository exists.

## Deploy job fails at SSH
- Check `EC2_HOST` (public IP/DNS), `EC2_USER` (usually `ubuntu`), and `EC2_SSH_KEY` (the **private** key content, not the `.pem` file name).
- Check the EC2 security group allows SSH (22) from GitHub's runners — GitHub-hosted runners have many IPs, so for a lab use `0.0.0.0/0` on port 22 only if you accept the risk, or use a self-hosted runner / VPN in production.
- Test SSH by hand first: `ssh -i your-key.pem ubuntu@YOUR_EC2_IP`

## Deploy job fails at the health check
- On the EC2, run `docker logs github-actions-node-app` and `docker ps -a`.
- Check nothing else is using port 3000, and that Docker is installed and running (`scripts/setup-ec2.sh`).

## The app on EC2 is an old version
- The deploy job pulls the image tagged with the commit SHA — if it deployed, it is the new code. Check `docker ps` shows the new image ID, and `curl http://localhost:3000/` shows the new `APP_VERSION` (the commit SHA).
- If the workflow ran on a pull request, the deploy job is skipped by design — only pushes to `main` deploy.

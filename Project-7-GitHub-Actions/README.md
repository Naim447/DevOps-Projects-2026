# Project 7: Build a Complete CI/CD Pipeline Using GitHub Actions

## Difficulty

- **Level:** 🟡 **Beginner to Intermediate**
- **Time to build:** 5–7 hours (including EC2 + secrets setup)
- **Prerequisite:** Project 2 (Docker) and Project 3 (Jenkins). This is the same pipeline idea as Project 3, built with GitHub Actions instead of Jenkins — no Jenkins server to maintain.

## Tools Required

- 📂 **GitHub** and **GitHub Actions**
- 🐳 **Docker** and **Docker Hub**
- ☁️ **AWS EC2** — Ubuntu (deploy target only)
- 🟢 **Node.js** and **Express**

## Project Overview

**GitHub Actions** is one of the most popular CI/CD platforms because it is built directly into GitHub.

Automate your build, testing, Docker image creation, and deployment without installing a separate CI/CD server.

## Project Objectives

1. Create a GitHub repository.
2. Build the application automatically.
3. Run automated tests.
4. Build a Docker image.
5. Push the image to Docker Hub.
6. Deploy the application to AWS EC2.

## Workflow

```
Push to main / Pull Request
        |
        v
GitHub Actions — build-and-test job
  1. Checkout
  2. Set up Node.js 22
  3. npm ci
  4. npm test
  5. Build Docker image
        |
        v  (pushes to main only, after CI passes)
GitHub Actions — deploy job
  6. Log in to Docker Hub
  7. Build + push image (SHA tag + latest)
  8. Deploy to EC2 over SSH
  9. Verify /health on EC2
```

## Repository Structure

```
Project-7-GitHub-Actions/
├── .github/workflows/ci-cd.yml   # the pipeline (2 jobs: build-and-test, deploy)
├── app/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── src/server.js             # /, /health
│   └── tests/app.test.js         # node --test, 2 tests
├── scripts/setup-ec2.sh          # install Docker on the EC2 deploy target
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── .gitignore
└── README.md
```

## Step-by-Step

### 1. Prepare the EC2 deploy target

Launch an Ubuntu EC2 instance. Security group:

| Port | Source | Purpose |
| --- | --- | --- |
| 22 | My IP / GitHub runners* | SSH deploy (see note below) |
| 3000 | My IP only | Application test |

\* GitHub-hosted runners use many IPs, so for a lab you may need to allow SSH more broadly, or use a self-hosted runner. In production, use a VPN / bastion host instead of opening SSH to the internet.

Install Docker on the EC2:

```bash
bash scripts/setup-ec2.sh
# or manually: sudo apt-get update && sudo apt-get install -y docker.io && sudo systemctl enable --now docker
```

### 2. Create the Docker Hub repository

In Docker Hub, create a repository, for example `github-actions-node-app`, and create an access token with push permission.

### 3. Add GitHub repository secrets

Repo → Settings → Secrets and variables → Actions → New repository secret. Add all five:

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) |
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_USER` | `ubuntu` (for Ubuntu AMIs) |
| `EC2_SSH_KEY` | The **contents** of your private `.pem` key file |

Also replace `YOUR_DOCKERHUB_USERNAME` in `.github/workflows/ci-cd.yml` (`IMAGE_NAME`) with your real Docker Hub username.

Never commit a token, a private key, or a real `.env` file.

### 4. Test the app locally

```bash
cd app
npm install
npm test
npm start
# curl http://localhost:3000/health
```

### 5. Push to GitHub and watch the pipeline

Push this folder to your repo (see the upload steps in the delivery message), then open the **Actions** tab in GitHub.

- On a pull request: only the `build-and-test` job runs.
- On a push to `main`: both jobs run — CI first, then deploy.

### 6. Verify the deployment

```bash
curl http://YOUR_EC2_PUBLIC_IP:3000/
curl http://YOUR_EC2_PUBLIC_IP:3000/health
```

The `/` response shows `APP_VERSION` as the commit SHA that was deployed.

## Skills You'll Learn

- Workflow Automation
- YAML Workflow Files
- GitHub Secrets
- Docker Image Build and Push in CI
- SSH Deployment from CI
- CI vs CD job separation (`needs` + `if:`)

## Resume Value

- Demonstrates hands-on GitHub Actions CI/CD — the most common CI/CD skill asked for in fresher / junior DevOps roles today.
- Shows you can automate build, test, image push and deployment without a separate CI server.
- Directly comparable to the Jenkins pipeline in Project 3 — being able to explain both is a strong interview answer. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `npm test` passes locally in `app/`
- [ ] All 5 GitHub secrets added, `YOUR_DOCKERHUB_USERNAME` replaced in the workflow
- [ ] Docker installed on the EC2, security group allows SSH + 3000
- [ ] Push to `main` — Actions tab shows both jobs green
- [ ] `curl http://<EC2_IP>:3000/` returns the project JSON with the commit SHA as version
- [ ] Open a pull request — only `build-and-test` runs, deploy is skipped
- [ ] No token, `.pem`, or real `.env` committed — check `git status`

## Clean Up

Stop / terminate the EC2 instance in the AWS Console when you are done, and delete the Docker Hub image if you no longer need it.

---

*Project 7 of DevOps-Projects-2026. Project 3 built this pipeline in Jenkins. This project builds the same pipeline in GitHub Actions.*

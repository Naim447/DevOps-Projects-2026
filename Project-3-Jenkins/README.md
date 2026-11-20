# Project 3: Build a CI/CD Pipeline Using Jenkins on AWS EC2

## Difficulty

- **Level:** 🟡 **Beginner to Intermediate**
- **Time to build:** 6–8 hours (including EC2 + Jenkins setup)
- **Prerequisite:** Project 1 (AWS EC2 + Linux) and Project 2 (Docker). Do those first if you have not.

## Tools Required

- ☁️ **AWS EC2** — Ubuntu
- ⚙️ **Jenkins**
- 📂 **GitHub**
- 🐳 **Docker** and **Docker Hub**
- 🟢 **Node.js** and **Express**

## 1. Project Overview

This project creates a Jenkins Pipeline that checks out a Node.js application from GitHub, runs tests, builds a Docker image, pushes the image to Docker Hub, deploys the container, and checks its health endpoint.

For a cost-conscious lab, Jenkins and the demo application run on the same EC2 instance. This is suitable for learning, not a production architecture.

## 2. Workflow

```
Developer pushes code
        |
        v
GitHub repository (Jenkinsfile + Node.js app)
        |
        v
Jenkins Pipeline
  1. Checkout
  2. Install dependencies
  3. Run tests
  4. Build Docker image
  5. Push image to Docker Hub
  6. Deploy container on EC2
  7. Verify health endpoint
```

## 3. Repository Structure

```
Project-3-Jenkins/
├── src/
│   └── server.js
├── tests/
│   └── app.test.js
├── scripts/
│   ├── setup-ec2.sh      # install Docker + Jenkins on EC2 (spec sections 7-8)
│   └── run-local.sh      # run the app locally without Jenkins/Docker
├── docs/
│   ├── INTERVIEW-QUESTIONS.md
│   └── TROUBLESHOOTING.md
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── Jenkinsfile
├── package.json
└── README.md
```

## 4. Prerequisites

- AWS account and an Ubuntu EC2 instance.
- SSH key securely stored on your computer.
- GitHub account and repository.
- Docker Hub account and repository.
- Basic Linux, Git, Docker, and Node.js knowledge.

### EC2 and security group

For this learning setup, choose an EC2 instance size that can support both Jenkins and Docker builds. Jenkins can need considerably more memory than the demo application. Check current AWS pricing and available instance types.

Security group inbound rules:

| Port | Protocol | Source | Purpose |
| --- | --- | --- | --- |
| 22 | TCP | My IP only | SSH |
| 8080 | TCP | My IP only | Jenkins web interface |
| 3000 | TCP | My IP only | Application test |

Do not expose Jenkins port 8080 to the entire internet. Jenkins is an administrative service. Use HTTPS and stronger access controls for any persistent public deployment. Do not put passwords, access tokens, private keys, or secrets into the repository.

## 5. Application Source Code

A small Express app with two routes:

- `GET /` — returns `{ message, project: "Project 3 - Jenkins", version, status: "healthy" }`
- `GET /health` — returns `{ status: "ok" }`

Any other route returns 404. The app listens on `PORT` (default 3000) and exports the app for tests (`module.exports = app`), so the tests can start it on a random port without running the server.

Tests (`tests/app.test.js`, Node's built-in `node --test` runner) check both routes return 200 with the expected body. Run them locally:

```bash
npm install
npm test
```

## 6. Create the AWS EC2 Server

1. Open the AWS Console and select EC2.
2. Launch an Ubuntu LTS instance.
3. Select an instance size with enough memory for Jenkins and Docker builds; a very small instance may run out of memory.
4. Configure SSH port 22 from My IP.
5. Add TCP 8080 from My IP for the Jenkins web interface.
6. Add TCP 3000 from My IP for the application test.
7. Launch the instance and note its public IP/DNS.

From Windows PowerShell, connect with your own key and actual instance address:

```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_EC2_PUBLIC_DNS
```

## 7. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y docker.io git curl
sudo systemctl enable --now docker
sudo docker --version
sudo docker run --rm hello-world
```

This lab uses `sudo docker` so you do not need to add a user to the Docker group. Docker group membership is highly privileged.

Or run the script in this repo on the server:

```bash
bash scripts/setup-ec2.sh
```

## 8. Install Jenkins

Use the official Jenkins Linux installation instructions for the current supported LTS release and Ubuntu version: https://www.jenkins.io/doc/book/installing/linux/

The following commands are for a Debian/Ubuntu system using the official Jenkins repository and Java 21 (also in `scripts/setup-ec2.sh`):

```bash
sudo apt-get update
sudo apt-get install -y fontconfig openjdk-21-jre

sudo install -m 0755 -d /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt-get update
sudo apt-get install -y jenkins
sudo systemctl enable --now jenkins
sudo systemctl status jenkins --no-pager
```

If the official Jenkins instructions have changed, follow the current instructions on jenkins.io instead of forcing an outdated repository/key.

### Allow Jenkins to use Docker

Jenkins runs as a dedicated operating-system user. Add it to the Docker group so its pipeline can execute Docker commands:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sudo -u jenkins -H docker version
```

Security note: Membership in the Docker group effectively grants root-level control of the host. Use this only on a dedicated lab instance you control. For production, use isolated build agents and tightly controlled deployment permissions.

If the last command fails, inspect the error and group membership:

```bash
id jenkins
sudo systemctl status docker --no-pager
sudo journalctl -u jenkins -n 100 --no-pager
```

## 9. Unlock and Configure Jenkins

1. Open this address from a computer allowed by the EC2 security group: `http://YOUR_EC2_PUBLIC_IP:8080`
2. Retrieve the initial password on the server:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Paste the password into the Jenkins setup screen.
4. Install the suggested plugins.
5. Create an administrator account.
6. Confirm the Jenkins URL.
7. Install/confirm the Pipeline, Git, and Credentials plugins in Manage Jenkins → Plugins.

Do not publish the initial admin password or screenshots containing it.

## 10. Configure Docker Hub Credentials in Jenkins

1. In Docker Hub, create a repository, for example `jenkins-node-app`.
2. Create an access token with the permissions needed to push images.
3. In Jenkins, open Manage Jenkins → Credentials.
4. Add a credential in the appropriate global/domain scope:
   - Kind: Username with password
   - Username: your Docker Hub username
   - Password: the Docker Hub access token
   - ID: `dockerhub-creds`
5. Save it.

The Jenkinsfile references this credential ID. Do not put your token directly in the Jenkinsfile.

For a public GitHub repository, the Jenkins Git checkout can use the public URL. For a private repository, add a suitable GitHub credential and configure the checkout to use it.

## 11. Create the Jenkinsfile

The `Jenkinsfile` at the root of this repository is the pipeline. **Before committing it, replace `YOUR_DOCKERHUB_USERNAME` in the `IMAGE_NAME` value with your real Docker Hub username.**

Stages: Checkout → Install Dependencies → Test → Build Docker Image → Push to Docker Hub → Deploy → Verify Deployment. The Deploy stage replaces the existing demo container, so it can cause a brief interruption. It is a learning deployment, not a zero-downtime release strategy.

## 12. Prepare and Upload the Repository to GitHub

This folder is meant to go into `DevOps-Projects-2026` as `Project-3-Jenkins/` (not as a separate repo — see the upload steps in the delivery message). If you do want it as a standalone repo, create a repository named `Project-3-Jenkins` on GitHub and, from your project directory:

```bash
git init
git add .
git commit -m "Add Jenkins CI/CD pipeline for Node.js Docker app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Project-3-Jenkins.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

Before pushing, inspect the staged files:

```bash
git status
git diff --cached --stat
```

Never commit AWS credentials, Docker Hub tokens, private SSH keys, Jenkins secrets, or real `.env` files.

## 13. Create the Jenkins Pipeline Job

1. Open Jenkins.
2. Select New Item.
3. Enter `Project-3-NodeJS-CICD`.
4. Select Pipeline and click OK.
5. Under Pipeline, select Pipeline script from SCM.
6. Choose Git.
7. Enter the GitHub repository URL.
8. Select branch `*/main`.
9. Set Script Path to `Jenkinsfile`.
10. Save and click Build Now.

If GitHub is private, configure the repository credentials before building.

## Skills You'll Learn

- Jenkins installation and configuration
- Continuous Integration (CI) and Continuous Delivery (CD)
- Jenkins Pipelines (declarative `Jenkinsfile`)
- GitHub integration (Pipeline script from SCM)
- Build automation and automated testing
- Docker image creation and Docker Hub push
- Application deployment and health-check verification
- Credentials handling in Jenkins (never hard-code secrets)

## Resume Value

- Demonstrates hands-on experience with **CI/CD automation**.
- Shows the ability to automate software delivery pipelines.
- Highlights knowledge of **Jenkins, GitHub, Docker, and Linux**.
- One of the most important projects for a beginner DevOps portfolio.
- Frequently discussed in **DevOps job interviews**. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] EC2 running, security group allows 22 / 8080 / 3000 from My IP only
- [ ] `docker run --rm hello-world` works on EC2
- [ ] Jenkins opens at `http://<EC2_IP>:8080`, admin account created
- [ ] `sudo -u jenkins -H docker version` works
- [ ] Docker Hub repo created, `dockerhub-creds` credential added in Jenkins
- [ ] `YOUR_DOCKERHUB_USERNAME` replaced in the Jenkinsfile
- [ ] `npm test` passes locally
- [ ] Jenkins job `Project-3-NodeJS-CICD` created (Pipeline script from SCM, branch `*/main`)
- [ ] Build Now succeeds — all 7 stages green
- [ ] `http://<EC2_IP>:3000/` returns the project JSON, `/health` returns `{"status":"ok"}`
- [ ] Push a small change to GitHub, confirm the pipeline runs again (or rebuild manually)
- [ ] No token, `.pem`, or real `.env` committed — check `git status`

## Clean Up (save money)

Stop / terminate the EC2 instance in the AWS Console when you are done, and remove the Docker Hub image if you no longer need it. Jenkins and the app run on the same lab instance — terminating it removes both.

---

*Project 3 of DevOps-Projects-2026.*

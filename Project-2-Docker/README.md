# Project 2: Dockerize a Node.js Application on AWS EC2

**Level:** Beginner  
**Stack:** AWS EC2, Ubuntu, Docker, Node.js, Express.js, Docker Hub, Git/GitHub

## 1. Project overview

This project packages a small Node.js/Express web API into a Docker image, runs it on an AWS EC2 Ubuntu server, tests it, and publishes the image to Docker Hub.

### Learning objectives
- Understand Docker images, containers, ports, logs, and lifecycle commands.
- Create a Dockerfile and `.dockerignore`.
- Build and run a containerized Express application.
- Use a Docker bridge network and a named volume.
- Push an image to Docker Hub and pull/run it again.
- Deploy a container on AWS EC2 and document the work in GitHub.

## 2. Architecture

```text
Developer laptop / GitHub
        |
        | source code + Dockerfile
        v
AWS EC2 Ubuntu instance (Docker Engine)
        |
        +-- Node.js + Express container
        |      Container port 3000
        |      Published EC2 port 3000
        |
        +-- Docker bridge network (practice)
        +-- Named volume (practice data)
        |
        v
Browser / curl: http://EC2_PUBLIC_IP:3000

Docker Hub stores the built image for distribution.
```

## 3. Repository structure

```text
Project-2-Docker/
├── src/
│   └── server.js
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 4. Prerequisites

- An AWS account and permission to launch an EC2 instance.
- An Ubuntu EC2 instance (Ubuntu 22.04 or 24.04 LTS is suitable).
- SSH access using your own `.pem` key.
- A Docker Hub account.
- Git installed on your computer.
- Basic Linux and terminal knowledge.

### Suggested EC2 configuration
For this small practice app, use a currently available small general-purpose instance compatible with your account and budget. Check current AWS pricing before launching. The app itself is lightweight, but Docker installation and image builds need disk space.

### Security group
Create inbound rules:
- SSH TCP 22: **My IP only**.
- Custom TCP 3000: **My IP only** while testing, or use an Application Load Balancer/HTTPS setup for a public production deployment.
- Do not open SSH to `0.0.0.0/0`.
- Remove port 3000 access when finished if it is no longer needed.

This practice project uses HTTP for learning. Do not send passwords, personal information, or other sensitive data through it. For a production service, put the app behind HTTPS and an appropriate reverse proxy/load balancer.

## 5. Application code

### `package.json`

```json
{
  "name": "project-2-docker-nodejs",
  "version": "1.0.0",
  "description": "Beginner Node.js Express application containerized with Docker on AWS EC2",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
```

### `src/server.js`

```javascript
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Hello from Node.js running inside Docker on AWS EC2!",
    project: "Project 2 - Dockerize a Node.js Application",
    status: "healthy"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.get("/api/info", (_req, res) => {
  res.status(200).json({
    application: "Docker Node.js Demo",
    runtime: process.version,
    environment: process.env.NODE_ENV || "development",
    hostname: require("node:os").hostname()
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Application listening on port ${PORT}`);
});
```

The app binds to `0.0.0.0` inside the container so Docker's published port can reach it.

### `Dockerfile`

```dockerfile
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src

USER node
EXPOSE 3000

CMD ["node", "src/server.js"]
```

For a more strictly reproducible build, generate and commit `package-lock.json`, then change the install command to `npm ci --omit=dev`.

### `.dockerignore`

```text
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
!.env.example
*.pem
*.key
coverage
.DS_Store
```

### `.gitignore`

```text
node_modules/
.env
.env.*
!.env.example
*.pem
*.key
npm-debug.log
.DS_Store
Thumbs.db
```

### Optional `docker-compose.yml`

This optional file runs the app locally with Compose. The primary deployment steps in this project use `docker run` on EC2.

```yaml
services:
  app:
    build: .
    container_name: node-docker-app
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      NODE_ENV: production
```

## 6. Step-by-step AWS deployment

### Step 1 — Launch EC2
1. Open the AWS Console and go to EC2.
2. Launch an Ubuntu LTS instance.
3. Create or select a key pair and keep the private `.pem` file safe.
4. Configure a security group with SSH port 22 from **My IP**.
5. Add TCP 3000 from **My IP** for temporary testing.
6. Launch the instance and copy its public IPv4 address or public DNS name.

Do not share your private key or upload it to GitHub.

### Step 2 — Connect from Windows PowerShell

Replace the key path and host with your actual values:

```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_EC2_PUBLIC_DNS
```

If SSH rejects the key on Windows, check the file path and Windows permissions. Do not paste the key contents into chat or GitHub.

### Step 3 — Install Docker Engine on Ubuntu

These commands use Ubuntu's distribution package. For a production environment, follow Docker's official Ubuntu installation documentation and choose the supported installation method for your OS.

```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable --now docker
sudo docker --version
sudo docker run --rm hello-world
```

Use `sudo docker` throughout this lab. This avoids adding the user to the Docker group, which grants highly privileged access on the host.

### Step 4 — Create the application on EC2

```bash
mkdir -p ~/Project-2-Docker/src
cd ~/Project-2-Docker
nano package.json
```

Paste the `package.json` content from Section 5, save, and exit (`Ctrl+O`, Enter, `Ctrl+X` in nano).

```bash
nano src/server.js
```

Paste the `server.js` content from Section 5 and save it.

```bash
nano Dockerfile
```

Paste the Dockerfile content and save it.

```bash
nano .dockerignore
```

Paste the `.dockerignore` content and save it.

Check files:

```bash
find . -maxdepth 2 -type f -print
```

### Step 5 — Build the Docker image

```bash
cd ~/Project-2-Docker
sudo docker build -t node-docker-app:1.0 .
sudo docker images
```

Explanation:
- `docker build`: builds an image.
- `-t node-docker-app:1.0`: assigns a name and tag.
- `.`: uses the current directory as the build context.

### Step 6 — Run the container

```bash
sudo docker run -d \
  --name node-docker-app \
  --restart unless-stopped \
  -p 3000:3000 \
  node-docker-app:1.0
```

Verify:

```bash
sudo docker ps
sudo docker logs node-docker-app
sudo docker inspect node-docker-app
```

### Step 7 — Test the application

From the EC2 shell:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/api/info
```

From your own computer, open:

```text
http://YOUR_EC2_PUBLIC_IP:3000/
http://YOUR_EC2_PUBLIC_IP:3000/health
http://YOUR_EC2_PUBLIC_IP:3000/api/info
```

Use the actual EC2 public IPv4 address. Ensure the security group only allows the intended source IP on port 3000.

Expected `/health` response resembles:

```json
{
  "status": "ok",
  "uptimeSeconds": 15
}
```

The uptime value changes each time.

## 7. Publish the image to Docker Hub

### Step 1 — Create a Docker Hub repository
1. Sign in at https://hub.docker.com/.
2. Create a repository, for example `node-docker-app`.
3. Decide whether it should be public or private.

### Step 2 — Log in securely on EC2

Create a Docker Hub access token in Docker Hub account settings. Use a token rather than your account password. Do not place the token in a shell command that becomes part of your notes or repository.

```bash
sudo docker login --username YOUR_DOCKERHUB_USERNAME
```

When prompted, enter your access token as the password. Avoid saving credentials in scripts or GitHub.

### Step 3 — Tag and push

Replace `YOUR_DOCKERHUB_USERNAME` with your username and use the exact repository name you created.

```bash
sudo docker tag node-docker-app:1.0 YOUR_DOCKERHUB_USERNAME/node-docker-app:1.0
sudo docker tag node-docker-app:1.0 YOUR_DOCKERHUB_USERNAME/node-docker-app:latest

sudo docker push YOUR_DOCKERHUB_USERNAME/node-docker-app:1.0
sudo docker push YOUR_DOCKERHUB_USERNAME/node-docker-app:latest
```

Verify the tags in your Docker Hub repository page.

### Step 4 — Pull and run the published image

To test that the registry image is usable, stop and remove the existing container first:

```bash
sudo docker stop node-docker-app
sudo docker rm node-docker-app

sudo docker pull YOUR_DOCKERHUB_USERNAME/node-docker-app:1.0

sudo docker run -d \
  --name node-docker-app \
  --restart unless-stopped \
  -p 3000:3000 \
  YOUR_DOCKERHUB_USERNAME/node-docker-app:1.0

curl http://localhost:3000/health
```

Do not remove the image if you still need it for comparison. Container removal does not delete a Docker Hub image.

## 8. Docker images, containers, volumes, and networks

### Images and containers

```bash
sudo docker images
sudo docker ps
sudo docker ps -a
sudo docker image inspect node-docker-app:1.0
sudo docker logs -f node-docker-app
sudo docker stats
```

- **Image:** read-only template used to create containers.
- **Container:** running or stopped instance created from an image.
- **Port mapping:** `-p 3000:3000` maps host port 3000 to container port 3000.

### Container lifecycle

```bash
sudo docker stop node-docker-app
sudo docker start node-docker-app
sudo docker restart node-docker-app
sudo docker rm -f node-docker-app
```

Only run `rm -f` when you are comfortable removing the container.

### Docker network practice

Create a user-defined bridge network and run a test container on it:

```bash
sudo docker network create project2-net
sudo docker run --rm --network project2-net busybox:1.36 nslookup node-docker-app
```

The lookup will work only if a container named `node-docker-app` is attached to that network. To attach the running app:

```bash
sudo docker network connect project2-net node-docker-app
sudo docker run --rm --network project2-net busybox:1.36 nslookup node-docker-app
sudo docker network inspect project2-net
```

Cleanup the practice network after testing:

```bash
sudo docker network disconnect project2-net node-docker-app
sudo docker network rm project2-net
```

### Docker volume practice

The application itself is stateless, so it does not need a volume. Practice a named volume separately:

```bash
sudo docker volume create project2-data
sudo docker run --rm -v project2-data:/data busybox:1.36 sh -c 'echo "Docker volume test" > /data/test.txt'
sudo docker run --rm -v project2-data:/data busybox:1.36 cat /data/test.txt
sudo docker volume inspect project2-data
```

Cleanup after testing if the data is no longer needed:

```bash
sudo docker volume rm project2-data
```

## 9. Troubleshooting

### Container exits immediately

```bash
sudo docker ps -a
sudo docker logs node-docker-app
```

Check for syntax errors in `server.js` and confirm the build completed successfully.

### Browser cannot connect
- Confirm the container is running: `sudo docker ps`.
- Check logs: `sudo docker logs node-docker-app`.
- Test inside EC2: `curl http://localhost:3000/health`.
- Verify EC2 security group inbound TCP 3000 allows your current public IP.
- Confirm the app listens on `0.0.0.0` and that `-p 3000:3000` was used.
- Check that you are using the correct public IP and that the instance is running.

### Port already in use

```bash
sudo docker ps
sudo ss -lntp | grep ':3000'
```

Stop the conflicting process/container or use another host port, such as `-p 3001:3000`, and visit port 3001. Update the security group if testing externally.

### Docker permission denied
Use `sudo docker ...` in this lab. Adding a user to the Docker group is not a harmless permission change because Docker can effectively grant root-level access.

### Docker Hub push denied
- Check the username and repository spelling.
- Check `sudo docker login`.
- Ensure the token has permission to push to that repository.
- Ensure the image tag includes your Docker Hub username.

## 10. GitHub upload

On your own computer, place the project files in a folder named `Project-2-Docker`.

```bash
git init
git add .
git commit -m "Add Dockerized Node.js application on AWS"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Project-2-Docker.git
git push -u origin main
```

Create the GitHub repository first, then replace `YOUR_GITHUB_USERNAME` with your own username.

### Never commit
- `.pem` or private SSH keys
- AWS access keys or secret keys
- Docker Hub access tokens
- Passwords or real `.env` files
- Unreviewed credentials in shell history or logs

## 11. Screenshots to add to GitHub README

Create a `screenshots/` directory if you want to commit screenshots, then capture:
1. EC2 instance running (hide sensitive details if desired).
2. Docker version and successful `hello-world`.
3. `docker images` showing your image.
4. `docker ps` showing the running container.
5. Browser response from `/` or `/health`.
6. Docker Hub repository showing the published tag.
7. GitHub repository with the source files.

Do not include private keys, tokens, account IDs, or other sensitive information in screenshots.

## 12. Interview questions

1. What is the difference between a Docker image and a container?
2. What is the purpose of a Dockerfile?
3. What does `EXPOSE 3000` do? Does it publish the port by itself?
4. What does `-p 3000:3000` mean?
5. Why should a Node.js process listen on `0.0.0.0` inside a container?
6. What is the difference between `docker run`, `docker start`, and `docker exec`?
7. Why use `.dockerignore`?
8. What is Docker Hub?
9. What are Docker volumes and networks?
10. How would you troubleshoot a container that runs locally but cannot be reached from the internet?
11. Why should secrets not be copied into a Docker image?
12. Why is running as a non-root user useful inside a container?

## 13. Resume description

**Dockerized Node.js Application on AWS EC2**
- Built and containerized a Node.js/Express application using a custom Dockerfile.
- Deployed the container on an Ubuntu EC2 instance and validated HTTP endpoints.
- Published versioned Docker images to Docker Hub and tested pulling and running the registry image.
- Practiced Docker image/container lifecycle commands, bridge networking, named volumes, logs, and troubleshooting.
- Documented setup, deployment, and security steps in GitHub.

Only list tasks you personally completed and verified.

## 14. Cleanup and cost control

When finished:
1. Stop and remove the container if it is no longer needed.
2. Log out of Docker Hub on a shared machine if applicable.
3. Remove unneeded local images, networks, and volumes only after confirming they are disposable.
4. Stop or terminate the EC2 instance if you do not need it.
5. Check for attached EBS volumes, Elastic IPs, snapshots, load balancers, and other billable resources.
6. Review AWS Billing and Cost Management.

Example container cleanup:

```bash
sudo docker rm -f node-docker-app
sudo docker image ls
```

Terminating an instance does not necessarily remove every associated resource. Verify the AWS console before assuming all costs have stopped.

## 15. Official documentation

- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Docker getting started: https://docs.docker.com/get-started/
- Docker build: https://docs.docker.com/build/
- Docker CLI reference: https://docs.docker.com/reference/cli/docker/
- Docker Hub: https://hub.docker.com/
- Node.js: https://nodejs.org/en
- Express: https://expressjs.com/
- AWS EC2 getting started: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html
- AWS security groups: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html

---

**Project status checklist**
- [ ] EC2 instance launched and connected securely
- [ ] Docker installed and verified
- [ ] Node.js/Express app responds locally
- [ ] Docker image built
- [ ] Container running and tested
- [ ] Docker Hub image pushed and pulled
- [ ] Docker network and volume exercises completed
- [ ] README and code pushed to GitHub
- [ ] Screenshots added
- [ ] AWS resources reviewed for cleanup

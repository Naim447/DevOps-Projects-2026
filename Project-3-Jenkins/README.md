# Project 3: Build a CI/CD Pipeline Using Jenkins on AWS EC2

**Difficulty:** Beginner to Intermediate  
**Tools:** AWS EC2, Ubuntu, Jenkins, GitHub, Docker, Node.js, Express, Docker Hub

## 1. Project overview

This project creates a Jenkins Pipeline that checks out a Node.js application from GitHub, runs tests, builds a Docker image, pushes the image to Docker Hub, deploys the container, and checks its health endpoint.

For a cost-conscious lab, Jenkins and the demo application run on the same EC2 instance. This is suitable for learning, not a production architecture.

## 2. Workflow

```text
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

## 3. Repository structure

```text
Project-3-Jenkins/
├── src/
│   └── server.js
├── tests/
│   └── app.test.js
├── .dockerignore
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
- SSH TCP 22: My IP only.
- Jenkins TCP 8080: My IP only, or access through a VPN/secure proxy.
- Application TCP 3000: My IP only for testing.

Do not expose Jenkins port 8080 to the entire internet. Jenkins is an administrative service. Use HTTPS and stronger access controls for any persistent public deployment. Do not put passwords, access tokens, private keys, or secrets into the repository.

## 5. Application source code

### `package.json`

```json
{
  "name": "project-3-jenkins-cicd",
  "version": "1.0.0",
  "description": "Node.js app for a Jenkins CI/CD learning project",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
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
    message: "Hello from the Jenkins CI/CD pipeline!",
    project: "Project 3 - Jenkins",
    version: process.env.APP_VERSION || "dev",
    status: "healthy"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application listening on port ${PORT}`);
  });
}

module.exports = app;
```

### `tests/app.test.js`

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

test("GET / returns project information", async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.project, "Project 3 - Jenkins");
    assert.equal(body.status, "healthy");
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test("GET /health returns ok", async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});
```

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

### `.dockerignore`

```text
node_modules
.git
.env
.env.*
*.pem
*.key
npm-debug.log
coverage
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
```

## 6. Create the AWS EC2 server

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

## 8. Install Jenkins

Use the official Jenkins Linux installation instructions for the current supported LTS release and Ubuntu version: https://www.jenkins.io/doc/book/installing/linux/

The following commands are for a Debian/Ubuntu system using the official Jenkins repository and Java 21:

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

**Security note:** Membership in the Docker group effectively grants root-level control of the host. Use this only on a dedicated lab instance you control. For production, use isolated build agents and tightly controlled deployment permissions.

If the last command fails, inspect the error and group membership:

```bash
id jenkins
sudo systemctl status docker --no-pager
sudo journalctl -u jenkins -n 100 --no-pager
```

## 9. Unlock and configure Jenkins

Open this address from a computer allowed by the EC2 security group:

```text
http://YOUR_EC2_PUBLIC_IP:8080
```

Retrieve the initial password on the server:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

1. Paste the password into the Jenkins setup screen.
2. Install the suggested plugins.
3. Create an administrator account.
4. Confirm the Jenkins URL.
5. Install/confirm the Pipeline, Git, and Credentials plugins in Manage Jenkins → Plugins.

Do not publish the initial admin password or screenshots containing it.

## 10. Configure Docker Hub credentials in Jenkins

1. In Docker Hub, create a repository, for example `jenkins-node-app`.
2. Create an access token with the permissions needed to push images.
3. In Jenkins, open **Manage Jenkins → Credentials**.
4. Add a credential in the appropriate global/domain scope:
   - Kind: Username with password
   - Username: your Docker Hub username
   - Password: the Docker Hub access token
   - ID: `dockerhub-creds`
5. Save it.

The Jenkinsfile below references this credential ID. Do not put your token directly in the Jenkinsfile.

For a public GitHub repository, the Jenkins Git checkout can use the public URL. For a private repository, add a suitable GitHub credential and configure the checkout to use it.

## 11. Create the Jenkinsfile

Create `Jenkinsfile` at the root of the GitHub repository.

```groovy
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_NAME = 'YOUR_DOCKERHUB_USERNAME/jenkins-node-app'
        CONTAINER_NAME = 'jenkins-node-app'
        APP_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                      --label "org.opencontainers.image.revision=$GIT_COMMIT" \
                      -t "$IMAGE_NAME:$BUILD_NUMBER" \
                      -t "$IMAGE_NAME:latest" .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set +x
                        echo "$DOCKERHUB_TOKEN" | docker login \
                          --username "$DOCKERHUB_USER" \
                          --password-stdin
                        docker push "$IMAGE_NAME:$BUILD_NUMBER"
                        docker push "$IMAGE_NAME:latest"
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

                    docker run -d \
                      --name "$CONTAINER_NAME" \
                      --restart unless-stopped \
                      -p "$APP_PORT:3000" \
                      -e APP_VERSION="$BUILD_NUMBER" \
                      "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    for attempt in $(seq 1 15); do
                      if curl --fail --silent \
                        http://127.0.0.1:$APP_PORT/health; then
                        echo
                        echo "Health check passed"
                        exit 0
                      fi
                      sleep 2
                    done

                    echo "Health check failed"
                    docker logs "$CONTAINER_NAME" || true
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
        success {
            echo 'CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Review the stage logs before retrying.'
        }
    }
}
```

**Important:** Replace `YOUR_DOCKERHUB_USERNAME` in the `IMAGE_NAME` value with your real Docker Hub username before committing the Jenkinsfile.

This pipeline uses the same EC2 host for Jenkins and the app. The deploy stage replaces the existing demo container, so it can cause a brief interruption. It is a learning deployment, not a zero-downtime release strategy.

## 12. Prepare and upload the repository to GitHub

Create a repository named `Project-3-Jenkins` on GitHub. Add all the files from Section 5 and the `Jenkinsfile`.

From your project directory:

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

## 13. Create the Jenkins Pipeline job

1. Open Jenkins.
2. Select **New Item**.
3. Enter `Project-3-NodeJS-CICD`.
4. Select **Pipeline** and click OK.
5. Under Pipeline, select **Pipeline script from SCM**.
6. Choose **Git**.
7. Enter the GitHub repository URL.
8. Select branch `*/main`.
9. Set Script Path to `Jenkinsfile`.
10. Save and click **Build Now**.

If GitHub is private, configure the repository credentials before building.

## 14. Run and verify the pipeline

In Jenkins, open the build and review the Console Output. Confirm all these stages pass:

1. Checkout
2. Install Dependencies
3. Test
4. Build Docker Image
5. Push to Docker Hub
6. Deploy
7. Verify Deployment

On EC2:

```bash
sudo docker ps
sudo docker logs jenkins-node-app
curl http://localhost:3000/health
curl http://localhost:3000/
```

From your browser, if your security group permits your IP:

```text
http://YOUR_EC2_PUBLIC_IP:3000/
http://YOUR_EC2_PUBLIC_IP:3000/health
```

Confirm that the image tag for the latest build is visible in Docker Hub.

## 15. Automate triggering from GitHub

For a beginner lab, start by using **Build Now**. To trigger automatically after a GitHub push, choose one of these methods:

### Option A — Poll SCM
In the Jenkins job configuration, enable **Poll SCM** and use a schedule such as:

```text
H/5 * * * *
```

This checks periodically for changes. It is simple but not an immediate webhook trigger.

### Option B — GitHub webhook
1. Configure the Jenkins GitHub integration/plugin as required.
2. Ensure Jenkins is reachable securely from GitHub. Do not expose an unsecured Jenkins instance just to make a webhook work.
3. In the GitHub repository, open Settings → Webhooks.
4. Add the HTTPS URL for your Jenkins GitHub webhook endpoint as instructed by the installed plugin.
5. Select push events.
6. Save and test delivery.
7. Verify the next push triggers a Jenkins build.

For a production setup, use HTTPS, restrict administrative access, and carefully review webhook and credential permissions.

## 16. Troubleshooting

### Jenkins page does not open
```bash
sudo systemctl status jenkins --no-pager
sudo journalctl -u jenkins -n 100 --no-pager
sudo ss -lntp | grep 8080
```
Check that EC2 is running and the security group allows TCP 8080 from your current public IP.

### Jenkins cannot run Docker
```bash
sudo -u jenkins -H docker version
id jenkins
sudo systemctl status docker --no-pager
```
Check Docker group membership and restart Jenkins after a group change. Remember that Docker access is highly privileged.

### npm tests fail
```bash
node --version
npm --version
npm install
npm test
```
Review the full test error in Jenkins Console Output. This project uses Node.js 22 in the image and expects a recent Node.js runtime for the test stage.

### Docker Hub push fails
- Verify the image name includes your Docker Hub username.
- Verify the `dockerhub-creds` ID matches Jenkins credentials.
- Ensure the token has push permission for the target repository.
- Review Docker Hub repository visibility and spelling.

### Port 3000 is already allocated
```bash
sudo docker ps
sudo ss -lntp | grep ':3000'
```
Stop the conflicting service or change the published host port consistently in the Jenkinsfile, security group, and test URL.

### Pipeline succeeds but website is unavailable
```bash
sudo docker ps -a
sudo docker logs jenkins-node-app
curl -v http://localhost:3000/health
```
Check the port mapping, container status, health endpoint, and security group.

## 17. Skills learned

- Jenkins installation and administration basics
- Declarative Jenkins Pipeline syntax
- GitHub source control integration
- Automated Node.js testing
- Docker image build and version tagging
- Docker Hub authentication and image publishing
- Container deployment and health verification
- Pipeline troubleshooting and credential management

## 18. Resume description

**Built a Jenkins CI/CD Pipeline on AWS EC2**
- Configured Jenkins on Ubuntu EC2 and integrated a GitHub-hosted Node.js application.
- Automated dependency installation, unit tests, Docker image creation, and Docker Hub publishing using a declarative Jenkinsfile.
- Automated container deployment and HTTP health verification on EC2.
- Managed registry credentials through Jenkins Credentials and documented deployment and troubleshooting procedures.

Only claim the stages and integrations you have successfully implemented and verified.

## 19. Interview questions

1. What is CI/CD?
2. What is Jenkins, and why is it used?
3. What is a Jenkinsfile?
4. What is the difference between declarative and scripted pipelines?
5. What is a Jenkins agent?
6. How does Jenkins get source code from GitHub?
7. What are Jenkins credentials?
8. Why should secrets not be stored in a Jenkinsfile?
9. What is the difference between a Docker image and a container?
10. How do you debug a failed Jenkins stage?
11. How can a GitHub push trigger Jenkins?
12. Why is a health check needed after deployment?
13. What are the security risks of running Docker commands from Jenkins?
14. How would you achieve zero-downtime deployment?

## 20. Cleanup and AWS cost control

When you finish the lab:
- Stop/remove the demo container if it is no longer required.
- Review whether Jenkins must remain running.
- Stop or terminate EC2 when you do not need it.
- Review attached EBS volumes, Elastic IPs, snapshots, and other billable resources.
- Check AWS Billing and Cost Management.

```bash
sudo docker rm -f jenkins-node-app
sudo docker image ls
```

Do not delete Jenkins data or Docker volumes unless you understand what they contain. Terminating EC2 does not always remove every associated billable resource.

## 21. Official documentation

- Jenkins installation: https://www.jenkins.io/doc/book/installing/
- Jenkins Pipeline: https://www.jenkins.io/doc/book/pipeline/
- Jenkins credentials: https://www.jenkins.io/doc/book/using/using-credentials/
- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Docker Hub: https://hub.docker.com/
- GitHub webhooks: https://docs.github.com/en/webhooks
- AWS EC2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html
- AWS security groups: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html

## 22. Project completion checklist

- [ ] EC2 instance created and secured
- [ ] Docker installed and tested
- [ ] Jenkins installed and unlocked
- [ ] Jenkins can run Docker commands
- [ ] Node.js source and tests committed to GitHub
- [ ] Docker Hub credentials added to Jenkins
- [ ] Jenkinsfile configured in a Pipeline job
- [ ] Automated tests passed
- [ ] Docker image pushed to Docker Hub
- [ ] Container deployed and health endpoint passed
- [ ] GitHub trigger configured (polling or webhook)
- [ ] Screenshots added to GitHub README
- [ ] AWS resources and costs reviewed

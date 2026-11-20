# Interview Questions — Project 3 (Jenkins CI/CD)

## 1. What does this pipeline do, stage by stage?
Checkout → Install Dependencies → Test → Build Docker Image → Push to Docker Hub → Deploy → Verify Deployment. Each stage must pass before the next runs; a failure stops the pipeline and the `post` block reports it.

## 2. Why run tests before building the Docker image?
A broken app should never become an image. Tests are cheap and fast; building and pushing a bad image wastes time and risks deploying it. Fail fast, fail in CI.

## 3. How does Jenkins get the Docker Hub password without it being in the code?
With a Jenkins credential: `dockerhub-creds`, kind Username with password, holding a Docker Hub access token (not your Docker Hub password). The Jenkinsfile only references the credential ID, and `withCredentials` puts it in `DOCKERHUB_USER` / `DOCKERHUB_TOKEN` for that step only. `set +x` stops the token being printed in the log.

## 4. What is the difference between a build number tag and `latest`?
`$BUILD_NUMBER` is unique and traceable to one Jenkins run and one Git commit. `latest` moves every time. Deploy the numbered tag (`$IMAGE_NAME:$BUILD_NUMBER`) so you can roll back to a known build; push `latest` as a convenience pointer.

## 5. Why does Deploy do `docker rm -f` before `docker run`?
The container name must be unique. Removing the old container first lets the new one take the same name and the same port (3000). This causes a brief interruption — it is a learning deployment, not zero-downtime.

## 6. How does the pipeline know the deployment worked?
The Verify stage curls `http://127.0.0.1:3000/health` up to 15 times, 2 seconds apart. If it never returns HTTP 200, the stage prints `docker logs` and fails the build, so a bad deploy is visible instead of silent.

## 7. Jenkins and the app on the same EC2 — is that production?
No. It is a cost-conscious lab setup. In production Jenkins and the app run on separate hosts / agents, Jenkins is not exposed to the internet, and deployment uses a proper release strategy. Say that in the interview — it shows you know the limit of the lab.

## 8. Why is Docker group membership for the `jenkins` user a security risk?
Membership in the Docker group effectively grants root-level control of the host. Use it only on a dedicated lab instance you control. For production, use isolated build agents and tightly controlled deployment permissions.

## 9. What is `checkout scm`?
It checks out the code from the same repository and branch the pipeline job is configured with (Pipeline script from SCM), instead of hard-coding a Git URL in the Jenkinsfile.

## 10. What does `post { always { docker image prune -f } }` do?
It cleans up unused Docker images after every run, so repeated builds do not fill the EC2 disk. It runs whether the build succeeds or fails.

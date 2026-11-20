# Interview Questions — Project 7 (GitHub Actions CI/CD)

## 1. What does this workflow do?
On every push to `main` and every pull request: checkout, set up Node 22, `npm ci`, `npm test`, build the Docker image. On pushes to `main` only, a second job pushes the image to Docker Hub and deploys it to EC2 over SSH, then verifies `/health`.

## 2. How is this different from the Jenkins pipeline in Project 3?
Same stages (test → build → push → deploy → verify), different runner: Jenkins needs a server you install and maintain; GitHub Actions runs on GitHub-hosted runners, triggered by events in the repo itself. The Jenkinsfile and the workflow file are the same idea in two tools — say that, and compare one stage in each.

## 3. Why does the deploy job have `needs: build-and-test` and an `if:` condition?
`needs` makes deploy wait for CI to pass — a failed test never reaches production. The `if:` makes deploy run only on pushes to `main`, not on pull requests, so a PR cannot deploy unfinished code.

## 4. How are secrets handled?
As GitHub repository secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`), referenced as `${{ secrets.NAME }}`. They are never in the workflow file, never printed in logs, and the Docker Hub token is an access token, not a password.

## 5. Why `npm ci` instead of `npm install` in CI?
`npm ci` installs exactly what `package-lock.json` says, and fails if the lock file is out of sync with `package.json`. That makes builds reproducible — the same code always builds the same way.

## 6. Why tag the image with the Git SHA as well as `latest`?
The SHA tag is unique and traceable to one commit and one workflow run. Deploy the SHA tag so you can roll back to a known build; `latest` is only a convenience pointer.

## 7. How does the deploy step know the deployment worked?
It curls `http://127.0.0.1:3000/health` on the EC2 host up to 15 times. If it never returns HTTP 200, it prints `docker logs` and fails the job, so a bad deploy is visible in the Actions tab instead of silent.

## 8. What would you change for production?
Separate the build and deploy environments (staging → production with an approval step), use OIDC instead of a long-lived SSH key, deploy with a rolling strategy instead of `docker rm -f` (brief downtime), and add a smoke test after deploy. The current setup is a learning deployment, not zero-downtime.

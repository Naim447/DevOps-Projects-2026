#!/usr/bin/env bash
# Prepare the EC2 deploy target: Docker only (no Jenkins here).
# Run on the Ubuntu EC2 server, once.
# Usage: bash scripts/setup-ec2.sh
set -euo pipefail
sudo apt-get update
sudo apt-get install -y docker.io git curl
sudo systemctl enable --now docker
sudo docker --version
sudo docker run --rm hello-world
echo "Done. The GitHub Actions deploy job logs in over SSH as the user"
echo "you put in the EC2_USER secret, and runs docker commands with sudo"
echo "if that user is not in the docker group."

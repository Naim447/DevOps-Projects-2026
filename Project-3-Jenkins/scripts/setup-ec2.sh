#!/usr/bin/env bash
# Install Docker + Jenkins on Ubuntu EC2 (run on the server, once).
# From the spec, sections 7-8. Check jenkins.io first if the
# official instructions have changed — do not force an outdated key/repo.
# Usage: bash scripts/setup-ec2.sh
set -euo pipefail

echo "== Docker =="
sudo apt-get update
sudo apt-get install -y docker.io git curl
sudo systemctl enable --now docker
sudo docker --version
sudo docker run --rm hello-world

echo "== Jenkins (Java 21 + official repo) =="
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

echo "== Allow Jenkins to use Docker (lab only — see README security note) =="
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sudo -u jenkins -H docker version

echo "== Done =="
echo "Initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
echo
echo "Open http://YOUR_EC2_PUBLIC_IP:8080 from a computer allowed by the security group."

# Project 6: Infrastructure as Code (IaC) Using Terraform

## Difficulty

- **Level:** 🟡 **Beginner to Intermediate**
- **Time to build:** 5–7 hours (including testing `plan` / `apply` / `destroy`)
- **Prerequisite:** Project 1 (AWS EC2, VPC and Security Groups by hand). This project does the same thing as code.

## Tools Required

- 🏗️ **Terraform** (>= 1.5)
- ☁️ **AWS** (account + credentials configured locally)
- 🐧 **Linux** / WSL / macOS

## Project Overview

Instead of manually creating cloud resources, use **Terraform** to provision infrastructure automatically.

This project introduces **Infrastructure as Code (IaC)**, enabling repeatable, version-controlled infrastructure deployments.

## AWS Resources You'll Create

- ☁️ EC2 Instance (Ubuntu 24.04, Nginx installed on first boot)
- 🔒 Security Group (SSH from your IP only, HTTP from anywhere)
- 🌐 VPC (`10.0.0.0/16`)
- 📡 Public Subnets (2 AZs) & Private Subnets (2 AZs)
- 🌍 Internet Gateway + public route table

```
                    Internet
                       |
                Internet Gateway
                       |
              VPC 10.0.0.0/16
        ┌──────────────┴──────────────┐
  Public 10.0.1.0/24 (ap-south-1a)   Public 10.0.2.0/24 (ap-south-1b)
    EC2 + Nginx                     (spare, for a second instance)
  Private 10.0.11.0/24              Private 10.0.12.0/24
    (no internet route — for databases later)
```

## Repository Structure

```
Project-6-Terraform/
├── main.tf                   # root: calls the 3 modules
├── variables.tf              # all inputs, with defaults
├── outputs.tf                # VPC, subnet, SG, EC2 IPs/DNS
├── versions.tf               # Terraform + AWS provider, S3 backend (commented)
├── terraform.tfvars.example  # copy to terraform.tfvars (git-ignored)
├── environments/dev/terraform.tfvars
├── modules/
│   ├── vpc/                  # VPC, IGW, public + private subnets, route table
│   ├── security-group/       # web Security Group
│   └── ec2/                  # Ubuntu AMI lookup, EC2, user_data (Nginx)
├── scripts/check.sh          # terraform fmt + init + validate
└── docs/
    ├── INTERVIEW-QUESTIONS.md
    └── TROUBLESHOOTING.md
```

## Benefits of Terraform

- Faster Deployments
- Version-Controlled Infrastructure
- Easy Rollback
- Reusable Configurations
- Automated Provisioning

## Step-by-Step

### 1. Install Terraform and configure AWS

```bash
terraform --version
aws sts get-caller-identity   # must show your account; if not, run: aws configure
```

Terraform needs AWS credentials. Never put keys in a `.tf` file.

### 2. Copy the variables file

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

- `key_name` — name of an existing EC2 key pair in this region (or leave `""`)
- `my_ip` — your public IP in CIDR form, e.g. `"203.0.113.45/32"`. Find it with `curl -s https://checkip.amazonaws.com`. The default `0.0.0.0/0` allows SSH from anywhere — change it before any real use.

### 3. Initialise, format and validate (no AWS changes yet)

```bash
terraform init
terraform fmt -recursive
terraform validate
# or: bash scripts/check.sh
```

### 4. Plan — read it before you apply

```bash
terraform plan
```

You should see about 10 resources to create: 1 VPC, 1 IGW, 4 subnets, 1 route table, 2 route associations, 1 Security Group, 1 EC2 instance. If the plan shows a destroy, stop and check what changed.

### 5. Apply

```bash
terraform apply
# Type yes when asked.
terraform output instance_public_ips
```

Open `http://<public-ip>` in a browser — you should see "Hello from Terraform".

### 6. Change something and apply again

Change `instance_count` to `2` in `terraform.tfvars`, then:

```bash
terraform plan
terraform apply
```

Terraform creates a second instance in the same public subnet. Change it back to `1` and apply again to remove it. That is the whole IaC idea in one demo.

### 7. Destroy (avoid charges)

```bash
terraform destroy
# Type yes when asked. Verify in the AWS Console that the VPC is gone.
```

## Skills You'll Learn

- Terraform Providers
- Variables
- State Files
- Modules
- Resource Management
- `data` sources (latest Ubuntu AMI lookup)
- Outputs and `count`

## Resume Value

- Demonstrates Infrastructure as Code expertise.
- Shows cloud automation skills.
- One of the most in-demand DevOps technologies.
- The module structure and the `plan`-before-`apply` habit are what interviewers look for. See `docs/INTERVIEW-QUESTIONS.md`.

## ✅ Final Checklist

- [ ] `terraform init`, `fmt`, `validate` all pass
- [ ] `terraform plan` reviewed — ~10 resources to create, 0 to destroy
- [ ] `terraform apply` succeeds, `terraform output instance_public_ips` shows an IP
- [ ] `http://<public-ip>` shows the Nginx page
- [ ] Change `instance_count` to 2, apply, see 2 instances; change back to 1
- [ ] `terraform destroy` removes everything (check the AWS Console)
- [ ] No `terraform.tfvars`, `*.tfstate` or `.pem` committed — check `git status`

## Clean Up

```bash
terraform destroy
```

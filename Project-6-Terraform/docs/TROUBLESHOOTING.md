# Troubleshooting — Project 6

## `terraform init` fails: no valid credential sources
- Terraform needs AWS credentials. Configure them with `aws configure`, or set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in the environment. Never put keys in a `.tf` file.
- Check the region matches: `aws sts get-caller-identity`

## `terraform plan` wants to create everything, every time
- You are in a different directory, or the state file was deleted / moved. State lives in `terraform.tfstate` (local backend here). Do not delete it while resources exist — Terraform will think they are gone and try to recreate them, and the old ones will be orphaned in AWS.

## `terraform apply` fails: InvalidKeyPair.NotFound
- `key_name` in `terraform.tfvars` does not exist in this region. Create the key pair in the AWS Console first, or set `key_name = ""` (no key — you will not be able to SSH in, but Nginx will still work).

## `terraform apply` fails: address is already in use / CIDR conflict
- The VPC CIDR `10.0.0.0/16` overlaps with an existing VPC in this account/region. Change `vpc_cidr` in `terraform.tfvars` to a free range, e.g. `10.1.0.0/16`, and adjust the subnet CIDRs to match.

## EC2 is created but the website does not open
- Wait 1–2 minutes for `user_data` (Nginx install) to finish on first boot.
- Check the Security Group allows HTTP 80 from `0.0.0.0/0` and that you are using the output public IP: `terraform output instance_public_ips`
- Check the instance is in a **public** subnet with a route to the Internet Gateway — that is what the VPC module sets up.

## `terraform fmt -check` fails
- Run `terraform fmt -recursive` to fix the formatting, then commit the result. CI in a real team runs the same check.

## How to clean up (avoid charges)
```bash
terraform destroy
# Type yes when asked. Check the AWS Console afterwards —
# VPC, subnets, Security Group and EC2 should all be gone.
```

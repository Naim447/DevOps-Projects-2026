# Interview Questions — Project 6 (Terraform)

## 1. What is Infrastructure as Code (IaC)?
Writing infrastructure in code files instead of clicking in the console. It is versioned in Git, reviewed like code, repeatable, and auditable. Terraform is declarative: you describe the desired end state, Terraform works out how to get there.

## 2. Terraform vs Ansible?
Terraform **provisions** infrastructure (VPC, subnets, EC2, Security Group). Ansible **configures** software on that infrastructure (install Nginx, create users). They are complementary — Project 6 is Terraform, Project 10 is Ansible.

## 3. What is Terraform state? Why does it matter?
State (`terraform.tfstate`) is Terraform's record of what it has created and how the real resources map to your code. Without it, Terraform cannot plan a change or destroy what it made. Never commit state — it can contain secrets — and never edit it by hand. Use `terraform state list` / `show` to inspect it.

## 4. What is the difference between `terraform plan` and `terraform apply`?
`plan` shows what Terraform *would* do, without changing anything. `apply` does it, after asking for confirmation (use `-auto-approve` only in automation you trust). Always read the plan first — in an interview, say that out loud.

## 5. What is a module?
A reusable bundle of `.tf` files with its own inputs (`variables.tf`) and outputs (`outputs.tf`). Here `modules/vpc`, `modules/security-group` and `modules/ec2` are used by the root `main.tf`. The same VPC module can be reused for dev, staging and prod with different variables.

## 6. How do you store state for a team?
In a remote backend — S3 bucket + DynamoDB table for locking (see the commented backend in `versions.tf`). That way two people cannot apply at the same time and corrupt the state, and the state is not lost if a laptop dies.

## 7. What does `count` do? What is its risk?
`count` creates N copies of a resource (here, N EC2 instances, 2 public subnets). The risk: removing an item from the middle of a list shifts the indexes and Terraform may destroy/recreate the wrong resources. For named resources, `for_each` is safer — mention it.

## 8. How do you handle secrets in Terraform?
Never put them in `.tf` files or in `terraform.tfvars` that is committed. Use variables from the environment (`TF_VAR_...`), AWS Secrets Manager / SSM Parameter Store, or a vault. And add `terraform.tfvars` and `*.tfstate` to `.gitignore` — this project already does.

## 9. What happens if you run `terraform destroy`?
It deletes every resource in the state. That is why the destroy step in the README is deliberate and why you check `terraform plan -destroy` first. In production, protect critical resources with `lifecycle { prevent_destroy = true }`.

## 10. How do you find the latest Ubuntu AMI without hard-coding an AMI ID?
With a `data "aws_ami"` block, as in `modules/ec2/main.tf` — filter by Canonical's owner ID and the Ubuntu 24.04 name pattern, `most_recent = true`. AMI IDs change per region and over time; hard-coding one breaks the next region.

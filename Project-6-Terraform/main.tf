# Project 6 — Infrastructure as Code with Terraform.
# Creates a VPC, public + private subnets, an Internet Gateway,
# a Security Group, and an EC2 instance running Nginx.
# No resource is created until you run: terraform apply

module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "security_group" {
  source = "./modules/security-group"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  my_ip        = var.my_ip
}

module "ec2" {
  source = "./modules/ec2"

  project_name    = var.project_name
  environment     = var.environment
  instance_type   = var.instance_type
  instance_count  = var.instance_count
  key_name        = var.key_name
  subnet_id       = module.vpc.public_subnet_ids[0]
  security_groups = [module.security_group.web_sg_id]
}

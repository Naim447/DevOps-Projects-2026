variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name, used in resource names and tags"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name, used as a prefix for resource names"
  type        = string
  default     = "project-6"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to use (must match the subnet lists)"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "instance_type" {
  description = "EC2 instance type (Free Tier eligible by default)"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair in this region. Empty means no key is attached."
  type        = string
  default     = ""
}

variable "my_ip" {
  description = "Your public IP in CIDR form, e.g. 203.0.113.45/32 — only this IP can SSH in"
  type        = string
  default     = "0.0.0.0/0"
  validation {
    condition     = can(cidrhost(var.my_ip, 0))
    error_message = "my_ip must be a valid CIDR block, e.g. 203.0.113.45/32."
  }
}

variable "instance_count" {
  description = "Number of EC2 instances to launch in the public subnets"
  type        = number
  default     = 1
}

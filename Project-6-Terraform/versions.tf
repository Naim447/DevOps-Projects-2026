terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state for this learning project. For a team / production
  # setup, move state to an S3 backend with DynamoDB locking —
  # see docs/INTERVIEW-QUESTIONS.md, question 6.
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "project-6/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Project-6-Terraform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

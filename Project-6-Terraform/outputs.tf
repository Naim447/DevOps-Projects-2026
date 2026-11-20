output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "security_group_id" {
  description = "ID of the web Security Group"
  value       = module.security_group.web_sg_id
}

output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "instance_public_ips" {
  description = "Public IPs of the EC2 instances — open http://<ip> to see Nginx"
  value       = module.ec2.public_ips
}

output "instance_public_dns" {
  description = "Public DNS names of the EC2 instances"
  value       = module.ec2.public_dns
}

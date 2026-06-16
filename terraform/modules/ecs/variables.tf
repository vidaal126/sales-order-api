variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "ecr_repository_url" {
  type = string
}

variable "ecs_execution_role_arn" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "cors_origin" {
  type = string
}

variable "aws_region" {
  type = string
}
variable "project_name" {
  type    = string
  default = "sales-order-api"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "github_org" {
  type        = string
  description = "Usuário ou organização no GitHub"
}

variable "github_repo" {
  type        = string
  description = "Nome do repositório no GitHub"
}

variable "db_name" {
  type    = string
  default = "sales_order_db"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "cors_origin" {
  type = string
}
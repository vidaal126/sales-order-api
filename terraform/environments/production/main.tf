terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 — armazena o estado do Terraform remotamente
  backend "s3" {
    bucket         = "sales-order-api-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "sales-order-api-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
}

# Módulo VPC
module "vpc" {
  source = "../../modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  cidr_block           = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
}

# Módulo IAM
module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment
  github_org   = var.github_org
  github_repo  = var.github_repo
}

# Módulo ECR
module "ecr" {
  source = "../../modules/ecr"

  repository_name = var.project_name
  environment     = var.environment
}

# Módulo RDS
module "rds" {
  source = "../../modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = "10.0.0.0/16"
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_class     = "db.t3.micro"
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  multi_az           = true
}

# Módulo ECS
module "ecs" {
  source = "../../modules/ecs"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  private_subnet_ids     = module.vpc.private_subnet_ids
  ecr_repository_url     = module.ecr.repository_url
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  database_url           = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}/${var.db_name}"
  cors_origin            = var.cors_origin
  aws_region             = var.aws_region
  container_port         = 3000
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
}
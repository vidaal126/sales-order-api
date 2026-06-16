output "alb_dns_name" {
  value       = module.ecs.alb_dns_name
  description = "URL pública da aplicação"
}

output "ecr_repository_url" {
  value       = module.ecr.repository_url
  description = "URL do ECR para push de imagens"
}

output "github_actions_role_arn" {
  value       = module.iam.github_actions_role_arn
  description = "ARN da role — adicionar como secret AWS_ROLE_ARN no GitHub"
}

output "ecs_cluster_name" {
  value       = module.ecs.cluster_name
  description = "Nome do cluster — adicionar como secret ECS_CLUSTER no GitHub"
}

output "ecs_service_name" {
  value       = module.ecs.service_name
  description = "Nome do serviço — adicionar como secret ECS_SERVICE no GitHub"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "Endpoint do banco de dados"
}

output "cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "Nome do cluster ECS — adicionar como secret ECS_CLUSTER"
}

output "service_name" {
  value       = aws_ecs_service.main.name
  description = "Nome do serviço ECS — adicionar como secret ECS_SERVICE"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS do Load Balancer — URL pública da aplicação"
}
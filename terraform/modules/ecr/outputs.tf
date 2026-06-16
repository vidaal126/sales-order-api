output "repository_url" {
  value       = aws_ecr_repository.main.repository_url
  description = "URL do repositório ECR para push de imagens"
}

output "repository_arn" {
  value = aws_ecr_repository.main.arn
}
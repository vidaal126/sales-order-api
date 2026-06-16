output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "ARN da role que o GitHub Actions vai assumir — adicionar como secret AWS_ROLE_ARN"
}

output "ecs_execution_role_arn" {
  value       = aws_iam_role.ecs_execution.arn
  description = "ARN da role de execução do ECS"
}
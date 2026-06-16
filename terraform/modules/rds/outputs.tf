output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Endpoint de conexão com o banco"
}

output "db_name" {
  value = aws_db_instance.main.db_name
}
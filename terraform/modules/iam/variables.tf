variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "github_org" {
  type        = string
  description = "Nome do usuário ou organização no GitHub"
}

variable "github_repo" {
  type        = string
  description = "Nome do repositório no GitHub"
}
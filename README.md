# Sales Order API (OVGS)

API RESTful para gerenciamento do ciclo completo de Ordens de Venda — do cadastro de clientes e itens até o agendamento e rastreabilidade de entregas, com arquitetura hexagonal e DDD.

`Node.js` `TypeScript` `NestJS` `Fastify` `PostgreSQL` `Prisma` `Docker`

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Endpoints da API](#endpoints-da-api)
- [Funcionalidades](#funcionalidades)
- [Comandos Úteis](#comandos-úteis)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Decisões Arquiteturais](#decisões-arquiteturais)
- [Observabilidade](#observabilidade)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Infraestrutura AWS](#infraestrutura-aws-terraform)
- [Escalabilidade e Performance](#escalabilidade-e-performance)
- [Trade-offs](#trade-offs)

---

## Sobre o Projeto

Sistema de gerenciamento de ordens de venda desenvolvido com foco em arquitetura e boas práticas de engenharia de software.

✨ **Principais Features:**

- 📦 Ciclo completo de Ordem de Venda com state machine controlada pelo domínio
- 🚚 Controle de transportes autorizados por cliente
- 📅 Agendamento e reagendamento de entregas
- 📋 Auditoria automática e desacoplada via eventos de domínio
- 📊 Observabilidade com Prometheus, Grafana, Loki e Promtail
- 📚 Documentação Swagger/OpenAPI provisionada automaticamente
- 🐳 Ambiente Docker completo (app + banco + observabilidade)

**Diferenciais Técnicos:**

- Arquitetura Hexagonal (Ports & Adapters)
- Domain-Driven Design (DDD)
- SOLID Principles
- Repository Pattern com abstract classes como tokens NestJS
- State Machine encapsulada na entidade de domínio
- Event-Driven Audit desacoplado dos Use Cases
- Stack de observabilidade completa (métricas, logs, dashboards)

---

## Tecnologias

| Categoria        | Tecnologia                                      |
| ---------------- | ----------------------------------------------- |
| Runtime          | Node.js 24 + TypeScript                         |
| Framework        | NestJS 11 + Fastify                             |
| ORM              | Prisma 7 com `@prisma/adapter-pg`               |
| Banco de dados   | PostgreSQL 17                                   |
| Validação        | class-validator + class-transformer             |
| Documentação     | Swagger / OpenAPI                               |
| Testes           | Vitest                                          |
| Logs             | nestjs-pino (JSON estruturado)                  |
| Métricas         | Prometheus + prom-client                        |
| Observabilidade  | Prometheus · Grafana · Loki · Promtail          |
| Segurança        | @fastify/helmet, CORS, Throttler                |
| Containerização  | Docker + Docker Compose                         |
| Infraestrutura   | Terraform + AWS (ECS Fargate, RDS, ECR, VPC)   |
| CI/CD            | GitHub Actions                                  |

---

## Pré-requisitos

- Docker >= 24.0
- Docker Compose v2 (`docker compose` sem hífen)
- Git

> Node.js e Yarn são necessários apenas para execução local (Opção 2). Para rodar via Docker, não são obrigatórios.

---

## Instalação e Execução

### Opção 1: Docker Compose (Recomendado) 🎉

Toda a aplicação roda em containers — banco, app e stack de observabilidade.

**Linux:**

```bash
# Instalar Docker Engine (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

**macOS:**

```bash
# Via Homebrew
brew install --cask docker
open /Applications/Docker.app
```

Ou baixe diretamente em [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).

**Windows:**

Baixe o Docker Desktop em [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Requisito: Windows 10/11 64-bit com WSL 2.

```powershell
# Habilitar WSL 2 (PowerShell como Administrador, se necessário)
wsl --install
```

Reinicie após a instalação.

---

**Executar (todos os sistemas):**

```bash
# 1. Clonar o repositório
git clone https://github.com/vidaal126/sales-order-api.git
cd sales-order-api

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir todos os containers
docker compose up -d

# 4. Acompanhar logs da aplicação
docker compose logs -f app
```

A aplicação sobe automaticamente com migrations aplicadas, Prisma Client gerado e hot reload ativo.

> **Windows (PowerShell):** use `copy .env.example .env` em vez de `cp .env.example .env`

Após subir, os serviços ficam disponíveis em:

| Serviço    | URL                                  |
| ---------- | ------------------------------------ |
| API        | http://localhost:3000                |
| Swagger    | http://localhost:3000/api/docs       |
| Métricas   | http://localhost:3000/metrics        |
| Prometheus | http://localhost:9090                |
| Grafana    | http://localhost:3001 (admin/admin)  |
| Loki       | http://localhost:3100                |

---

### Opção 2: Execução Local (Desenvolvimento)

Requer Node.js 24+ e Yarn instalados. Use o Docker apenas para o banco de dados.

```bash
# 1. Subir apenas o PostgreSQL
docker compose up -d postgres

# 2. Clonar e configurar
git clone https://github.com/vidaal126/sales-order-api.git
cd sales-order-api
cp .env.example .env
# Editar .env: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_order_db

# 3. Instalar dependências
yarn install

# 4. Gerar Prisma Client
npx prisma generate

# 5. Aplicar migrations
npx prisma migrate deploy

# 6. Iniciar em modo watch
yarn start:dev
```

---

## Endpoints da API

Acesse a documentação interativa em: **http://localhost:3000/api/docs**

| Método | Rota                                | Descrição                    |
| ------ | ----------------------------------- | ---------------------------- |
| POST   | `/api/v1/customers`                 | Criar cliente                |
| GET    | `/api/v1/customers`                 | Listar clientes              |
| PUT    | `/api/v1/customers/:id`             | Atualizar cliente            |
| POST   | `/api/v1/transport-types`           | Criar tipo de transporte     |
| GET    | `/api/v1/transport-types`           | Listar tipos de transporte   |
| PUT    | `/api/v1/transport-types/:id`       | Atualizar tipo de transporte |
| POST   | `/api/v1/items`                     | Criar item                   |
| GET    | `/api/v1/items`                     | Listar itens                 |
| POST   | `/api/v1/sales-orders`              | Criar ordem de venda         |
| GET    | `/api/v1/sales-orders`              | Listar ordens (com filtros)  |
| GET    | `/api/v1/sales-orders/:id`          | Buscar ordem por ID          |
| PUT    | `/api/v1/sales-orders/:id/status`   | Atualizar status da ordem    |
| POST   | `/api/v1/sales-orders/:id/schedule` | Agendar entrega              |
| PUT    | `/api/v1/sales-orders/:id/schedule` | Reagendar entrega            |
| GET    | `/metrics`                          | Métricas Prometheus          |

---

## Funcionalidades

### 🔄 Fluxo da Ordem de Venda

```
CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE
```

Transições fora dessa sequência são rejeitadas com HTTP 422 pelo domínio, antes de chegar no banco.

**Criar uma ordem:**

```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente Exemplo",
    "document": "12345678900",
    "authorizedTransportTypeIds": ["uuid-do-tipo-de-transporte"]
  }'
```

**Avançar o status:**

```bash
curl -X PUT http://localhost:3000/api/v1/sales-orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "PLANEJADA" }'
```

### 🚚 Transportes Autorizados

Cada cliente possui uma lista de tipos de transporte autorizados. Ao criar uma ordem, o sistema valida se o tipo selecionado está autorizado para aquele cliente. Rejeita com HTTP 422 caso contrário.

### 📋 Auditoria Automática

Toda transição de status gera um registro de auditoria automaticamente, sem que os Use Cases precisem conhecer o repositório de auditoria:

```
UseCase → emit('order.created') → AuditListener → AuditLogRepository
```

### 📅 Agendamento de Entrega

```bash
curl -X POST http://localhost:3000/api/v1/sales-orders/ORDER_ID/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryDate": "2026-07-01T00:00:00.000Z",
    "windowStart": "2026-07-01T08:00:00.000Z",
    "windowEnd": "2026-07-01T12:00:00.000Z"
  }'
```

---

## Comandos Úteis

### Aplicação

```bash
yarn start:dev      # Hot-reload (desenvolvimento)
yarn build          # Compilar TypeScript
yarn start:prod     # Rodar build de produção
yarn test           # Rodar testes
yarn test:cov       # Testes com coverage
yarn lint           # Lint + auto-fix (Biome + ESLint)
```

### Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations (produção)
npx prisma migrate deploy

# Abrir GUI do banco
npx prisma studio

# Reset do banco (CUIDADO — apaga tudo)
npx prisma migrate reset
```

Via Docker:

```bash
docker compose exec app npx prisma studio
docker compose exec app npx prisma migrate deploy
```

### Docker

```bash
# Ver status dos containers
docker compose ps

# Logs de um serviço
docker compose logs -f app
docker compose logs -f postgres

# Acessar shell do container
docker compose exec app sh

# Reiniciar apenas a aplicação
docker compose restart app

# Parar tudo
docker compose down

# Parar e limpar volumes (banco zerado)
docker compose down -v

# Rebuild sem cache
docker compose build --no-cache app
```

### PostgreSQL

```bash
# Acessar psql
docker compose exec postgres psql -U postgres -d sales_order_db

# Comandos úteis dentro do psql
\dt                                        -- listar tabelas
SELECT id, name, document FROM customers;
SELECT id, status, customer_id FROM sales_orders;
\q                                         -- sair
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```env
# Aplicação
NODE_ENV=development
PORT=3000

# PostgreSQL
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=postgres
POSTGRESQL_NAME=sales_order_db
POSTGRESQL_PORT=5432

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_order_db

# CORS (origens separadas por vírgula)
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=info
```

> Em produção, altere `POSTGRESQL_PASSWORD` e configure `CORS_ORIGIN` com a origem real do frontend.

---

## Decisões Arquiteturais

### Arquitetura Hexagonal

```mermaid
graph TD
    subgraph Presentation
        C[Controllers]
        D[DTOs]
        S[Swagger]
    end

    subgraph Application
        UC[Use Cases]
    end

    subgraph Domain
        E[Entities]
        I[Repository Interfaces]
        EV[Domain Events]
        EX[Domain Exceptions]
    end

    subgraph Infrastructure
        R[Repositories - Prisma]
        AL[AuditListener]
        MI[MetricsInterceptor]
        DB[(PostgreSQL)]
    end

    C --> UC
    UC --> E
    UC --> I
    UC --> EV
    E --> EX
    I --> R
    R --> DB
    EV --> AL
    AL --> R
```

### Hexagonal Architecture (Ports & Adapters)

```
Presentation (Controllers/DTOs)
        ↓
Application (Use Cases)
        ↓
Domain (Entities + Interfaces)
        ↑
Infrastructure (Repositories/Prisma)
```

Possível trocar Prisma por TypeORM, ou NestJS por Express, sem tocar em nenhuma regra de negócio.

### State Machine para Ordens de Venda

```typescript
const VALID_TRANSITIONS = {
  CRIADA: ["PLANEJADA"],
  PLANEJADA: ["AGENDADA"],
  AGENDADA: ["EM_TRANSPORTE"],
  EM_TRANSPORTE: ["ENTREGUE"],
  ENTREGUE: [],
};
```

### Modelagem do Domínio

| Entidade           | Responsabilidade                                                                 |
| ------------------ | -------------------------------------------------------------------------------- |
| `CustomerEntity`   | Guarda a lista de transportes autorizados e valida via `isTransportAuthorized()` |
| `SalesOrderEntity` | Encapsula a state machine de status via `transitionTo()` e `canTransitionTo()`   |
| `SchedulingEntity` | Controla agendamento e reagendamento de entregas                                 |
| `AuditLogEntity`   | Registra todos os eventos relevantes com estado anterior e posterior             |

### Persistência

- **Prisma 7** com adapter `@prisma/adapter-pg` — conexão direta com PostgreSQL
- Schema separado por modelo em `src/infrastructure/database/prisma/models/`
- Índices em campos de filtro: `status`, `customerId`, `transportTypeId`, `createdAt`, `deliveryDate`
- Chave primária composta em `CustomerTransportType` (N:N sem coluna `id` extra)

---

## Observabilidade

Stack completa rodando via Docker Compose:

| Serviço    | URL                   | Função                     |
| ---------- | --------------------- | -------------------------- |
| Prometheus | http://localhost:9090 | Coleta e armazena métricas |
| Grafana    | http://localhost:3001 | Dashboards (admin/admin)   |
| Loki       | http://localhost:3100 | Armazena logs estruturados |
| Promtail   | -                     | Coleta logs Docker → Loki  |

**Métricas coletadas:**

- `http_requests_total` — total de requisições por método, rota e status
- `http_request_duration_seconds` — histograma de latência (p50, p95, p99) por rota
- `http_errors_total` — total de erros 4xx/5xx por rota
- Default metrics do Node.js (`process_*`, `nodejs_*`) via prom-client

O dashboard **Sales Order API - Base Monitoring** é provisionado automaticamente no Grafana e inclui HTTP Requests/min, Error Rate, Latency (p50/p95/p99), erros por rota e logs via Loki.

```bash
# Verificar métricas
curl http://localhost:3000/metrics

# Consultar logs no Loki
curl "http://localhost:3100/loki/api/v1/query_range?query={container=\"sales-order-api-app\"}&limit=10"
```

---

## Testes

```bash
# Unitários e de integração
yarn test

# Com cobertura
yarn test:cov
```

**Cobertura atual:**

- **9 testes unitários** — State machine da `SalesOrderEntity`
- **4 testes unitários** — `CreateSalesOrderUseCase` com mocks
- **2 testes de integração** — `CreateSalesOrderUseCase` com banco real

Os testes de integração requerem um banco PostgreSQL rodando. Em CI, um service container PostgreSQL é provisionado automaticamente.

---

## CI/CD

### CI (`.github/workflows/ci.yml`)

Roda em todo push e Pull Request para `main`:

1. Install dependencies
2. Prisma generate (tipos gerados necessários para o type check)
3. Type check (`tsc --noEmit`)
4. Lint (Biome + ESLint)
5. Migrations
6. Tests

### CD (`.github/workflows/cd.yml`)

Deploy automático na `main` (desabilitado até infraestrutura AWS ser provisionada):

1. Autenticação via OIDC (sem chaves estáticas)
2. Login no ECR
3. Build + push da imagem Docker
4. Deploy no ECS Fargate
5. Aguarda estabilização do serviço

---

## Infraestrutura AWS (Terraform)

Infraestrutura provisionada via Terraform modular em `terraform/`:

```
terraform/
├── modules/
│   ├── vpc/        # VPC, subnets, IGW, NAT Gateway
│   ├── iam/        # OIDC Provider, roles GitHub Actions + ECS
│   ├── ecr/        # Repositório de imagens + lifecycle policy
│   ├── rds/        # PostgreSQL 17 gerenciado, Multi-AZ
│   └── ecs/        # Cluster, Task Definition, Service, ALB
└── environments/
    └── production/ # Configuração de produção com backend S3
```

| Serviço     | Justificativa                                                         |
| ----------- | --------------------------------------------------------------------- |
| ECS Fargate | Sem gerenciar servidores — suficiente para aplicação single-container |
| RDS         | Backups automáticos, failover, patches gerenciados                    |
| ECR         | Repositório privado com integração nativa ao ECS                      |
| ALB         | Load balancer com health check automático                             |
| OIDC + IAM  | Credenciais temporárias (15min) — sem chaves estáticas no GitHub      |

```bash
cd terraform/environments/production
terraform init
terraform plan
terraform apply
```

Os outputs incluem os valores necessários para configurar os GitHub Secrets do CD workflow.

---

## Escalabilidade e Performance

**Escalabilidade:**

- **Message broker:** `IEventEmitter` pode ser substituído por adapter RabbitMQ/Kafka sem alterar Use Cases
- **Cache:** camada Redis pode ser adicionada aos repositórios sem impacto no domínio
- **Read model:** `findAll` com filtros pode ser extraído para repositório de leitura separado (CQRS)
- **Auto-scaling:** ECS Service Auto Scaling com CloudWatch alarms
- **Microserviços:** cada módulo pode ser extraído para um serviço independente

**Performance:**

- Índices em todos os campos de filtro e join
- `WHERE id IN (...)` em vez de N queries individuais
- `include` do Prisma usado estrategicamente para evitar N+1
- Route templates (não URLs reais) nas métricas para baixa cardinalidade de labels

---

## Trade-offs

| Decisão                                 | Trade-off                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Prisma Schema separado por arquivo      | Usa `prismaSchemaFolder` (Prisma 7 estável) — sem suporte em versões anteriores |
| `updatedAt` gerenciado pelo Prisma      | A entidade de domínio reflete o valor persistido, não calcula em memória        |
| Audit via EventEmitter2 in-process      | Simples e suficiente para o escopo — em produção migraria para broker externo   |
| Sem paginação nos endpoints de listagem | Fora do escopo do desafio — adicionaria `cursor-based pagination` em produção   |
| Testes de integração com banco real     | Requer banco rodando — em CI usa service container PostgreSQL                   |
| ECS Fargate sem auto-scaling            | `desired_count=1` — em produção configuraria auto-scaling por CPU/memória       |
| /metrics via Fastify raw                | Necessário para compatibilidade com URI versioning — bypassa middleware NestJS  |

---

## Troubleshooting

**Porta 3000 já em uso:**

```bash
# Linux/macOS
lsof -i :3000
kill -9 PID

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**`docker compose` não encontrado:**

```bash
# Instalar plugin
sudo apt-get install docker-compose-plugin

# Verificar versão
docker compose version
```

**Prisma Client não gerado (erro de import):**

```bash
docker compose exec app npx prisma generate
# ou localmente:
npx prisma generate
```

**Migrations não aplicadas:**

```bash
docker compose exec app npx prisma migrate deploy
```

**Hot-reload não funciona (volume conflict):**

Confirme que `/app/dist` NÃO está nos volumes do `docker-compose.yml`:

```yaml
volumes:
  - .:/app
  - /app/node_modules  # correto — isola node_modules do host
```

**Container da aplicação não sobe (healthcheck do postgres falhando):**

```bash
docker compose logs postgres
docker compose ps
# Aguardar o postgres ficar healthy antes de subir o app
docker compose up -d postgres
docker compose up -d app
```

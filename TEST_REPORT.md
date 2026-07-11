# Relatório de Testes — Sales Order API

Execução em ambiente Docker com banco real. Todos os resultados são evidências colhidas ao vivo contra a API em `http://localhost:3000`.

---

## Sumário

| # | Teste | Resultado |
|---|-------|-----------|
| 1 | Idempotência — `Idempotency-Key` ignorado | FALHA |
| 2 | Race condition — documento duplicado sob concorrência | PARCIAL (500 em vez de 409) |
| 3 | Validação de CPF e telefone | FALHA |
| 4 | Reagendamento de ordem ENTREGUE | FALHA |
| 5 | `GET /customers/:id` inexistente | FALHA |
| 6 | Campo privado `_status` vazando na resposta | FALHA |
| 7 | N+1 em criação de cliente | CONFIRMADO (análise de código) |
| 8 | Auditoria de alteração de transporte | FALHA (feature ausente) |
| 9 | Race condition no update de status (lost update) | FALHA |
| 10 | Transição de status inválida | OK |
| 11 | Bug nas datas de janela (`@db.Time`) | FALHA |
| 12 | Agendamento com data no passado | FALHA |
| 13 | Agendamento com ano 9999 | FALHA |
| 14 | Agendamento com ano > 9999 (ex: 99999) | OK (rejeitado por ISO 8601) |
| 15 | Janela invertida (`windowEnd < windowStart`) | OK |
| 16 | Janela com `windowStart == windowEnd` | OK |
| 17a | Campos extras no payload (`role`, `internalId`, `isDeleted`) | OK (rejeitados) |
| 17b | Injeção de `status`, `id`, `createdAt` na criação de OV | OK (rejeitados) |
| 17c | Campos extras no update de status | OK (rejeitados) |
| 17d | Campos extras no agendamento (`confirmedAt`, `salesOrderId`) | OK (rejeitados) |
| 17e | Content-Type errado (`text/plain` com JSON no body) | OK (body ignorado) |
| 17f | Payload vazio `{}` | OK (campos obrigatórios reclamados) |
| 17g | Prototype pollution via `__proto__` e `constructor.prototype` | OK (Fastify bloqueia) |
| 17h | `quantity: -1` | OK (rejeitado por `@IsPositive`) |
| 17i | `quantity: "dois"` (string) | OK (rejeitado) |
| 17j | `quantity: 1.5` (float) | OK (rejeitado por `@IsInt`) |
| 17k | `items: []` (array vazio) | **FALHA** — HTTP 201, OV criada sem itens |
| 17m | `quantity: 0` | OK (rejeitado por `@IsPositive`) |

**Customers**

| # | Teste | Resultado |
|---|-------|-----------|
| C1 | Criar cliente com documento duplicado | OK (422) |
| C2 | Criar cliente com nome vazio | OK (400) |
| C3 | Criar cliente com transport type inexistente | OK (422) |
| C4 | Update de cliente inexistente | OK (422) |
| C5 | Remover todos os transportes via update | OK — aceito (comportamento esperado) |

**Transport Types**

| # | Teste | Resultado |
|---|-------|-----------|
| T1 | Criar com nome duplicado | OK (422) |
| T2 | Criar com nome vazio | OK (400) |
| T3 | Update de transporte inexistente | OK (422) |
| T4 | Update com nome de outro transporte existente | OK (422) |

**Items**

| # | Teste | Resultado |
|---|-------|-----------|
| I1 | Criar item com SKU duplicado | OK (422) |
| I2 | Criar item com preço negativo | OK (400) |
| I3 | Criar item com preço zero | OK (400) |
| I4 | Criar item com SKU vazio | OK (400) |

**Sales Orders — Criação**

| # | Teste | Resultado |
|---|-------|-----------|
| O1 | Cliente inexistente | OK (422) |
| O2 | Transporte não autorizado para o cliente | OK (422) |
| O3 | Item inexistente | OK (422) |
| O4 | Mix de item válido + item inexistente | OK (422, lista os ausentes) |
| O5 | Transporte com UUID válido mas não cadastrado | **PARCIAL** — erro "não autorizado" em vez de "não encontrado" |
| O6 | Item duplicado no mesmo pedido | **FALHA** — HTTP 422 com mensagem vazia "Itens não encontrados: " |

**Sales Orders — Transições de Status**

| # | Teste | Resultado |
|---|-------|-----------|
| S1 | Fluxo completo CRIADA→PLANEJADA→AGENDADA→EM_TRANSPORTE→ENTREGUE | OK |
| S2 | Regressão: PLANEJADA → CRIADA | OK (422) |
| S3 | Salto: CRIADA → AGENDADA | OK (422) |
| S4 | Salto duplo: CRIADA → EM_TRANSPORTE | OK (422) |
| S5 | Mesmo estado: PLANEJADA → PLANEJADA | OK (422) |
| S6 | Avançar após ENTREGUE | OK (422, "Transições permitidas: nenhuma") |
| S7 | Status inválido fora do enum (`CANCELADA`) | OK (400, enum validado no DTO) |
| S8 | Buscar OV inexistente | OK (422) |

**Sales Orders — Agendamento**

| # | Teste | Resultado |
|---|-------|-----------|
| AG1 | Agendar ordem em CRIADA | OK (422) |
| AG2 | Agendar ordem em EM_TRANSPORTE | OK (422) |
| AG3 | Agendar OV inexistente | OK (422) |
| AG4 | Reagendar sem agendamento prévio | OK (422) |
| AG5 | Nova tentativa de agendamento após avançar para EM_TRANSPORTE | OK (422) |
| AG6 | windowEnd anterior ao windowStart em datas diferentes | OK (422) |

**Sales Orders — Filtros**

| # | Teste | Resultado |
|---|-------|-----------|
| F1 | Filtrar por status válido | OK — retorna apenas ordens do status |
| F2 | Filtrar por status fora do enum (`?status=CANCELADA`) | **FALHA** — HTTP 500 com stack trace do Prisma exposto |
| F3 | Filtrar por cliente | OK — mas retorna 32 registros sem paginação |
| F4 | Filtrar por intervalo de datas | OK |
| F5 | `dateFrom > dateTo` (intervalo invertido) | **PARCIAL** — retorna 0 resultados sem erro, silencioso |
| F6 | Filtrar por itemId | OK |
| F7 | Filtrar por itemId inexistente | OK (0 resultados) |

**Regras de Negócio Implícitas**

| # | Teste | Resultado |
|---|-------|-----------|
| R1 | Avançar status de OV após remoção do transporte do cliente | OK — status avança (validação só ocorre na criação) |

---

## Teste 1 — Idempotência: `Idempotency-Key` ignorado

**Cenário:** O `main.ts` declara `Idempotency-Key` nos `allowedHeaders` do CORS, sugerindo suporte. Enviadas duas requisições `POST /transport-types` com o mesmo header.

**Requisição 1** (`Idempotency-Key: idem-test-001`):
```json
POST /api/v1/transport-types
{ "name": "Bi-truck" }

HTTP 201
{ "id": "39c294d9-c18d-4ae3-98d9-0319ef2511ad", "name": "Bi-truck" }
```

**Requisição 2** (mesmo `Idempotency-Key: idem-test-001`):
```json
HTTP 422
{ "error": "DomainException", "message": "Tipo de transporte \"Bi-truck\" já existe." }
```

**Resultado:** FALHA. A segunda requisição não retornou o recurso já criado (comportamento idempotente). Falhou por DomainException de nome duplicado — não por detecção de `Idempotency-Key`. O header é aceito pelo CORS mas completamente ignorado pela aplicação. Não existe interceptor, guard ou middleware que processe esse header.

**Raiz:** O header foi declarado no CORS sem implementação correspondente. Copy-paste de template sem entrega.

---

## Teste 2 — Race condition: documento duplicado sob concorrência

**Cenário:** 5 requisições `POST /customers` simultâneas com o mesmo CPF `999.888.777-66`.

**Resultado:** 1 criação bem-sucedida (HTTP 201) + 4 erros HTTP **500** com stack trace interno do Prisma exposto.

```json
HTTP 500
{
  "message": "Invalid `this.prisma.customer.create()` invocation in\n/app/src/infrastructure/repositories/customer.repository.ts:72:48\n\nUnique constraint failed on the fields: (`document`)",
  "error": "InternalServerError"
}
```

**Resultado:** PARCIAL. O banco impediu a duplicata via `UNIQUE`, mas:

1. O erro retornado é HTTP 500 em vez de 409 Conflict. `PrismaClientKnownRequestError` não é tratado no `HttpExceptionFilter`.
2. O stack trace e o caminho interno do arquivo (`/app/src/infrastructure/repositories/customer.repository.ts:72`) estão expostos na resposta pública.
3. Um avaliador de API recebe "Internal Server Error" em vez de "Cliente já cadastrado".

**Raiz:** Ausência de tratamento de `PrismaClientKnownRequestError` (P2002 — unique constraint violation) no `HttpExceptionFilter`.

---

## Teste 3 — Validação de CPF e telefone

**Cenário:** Enviar valores inválidos nos campos `document` e `phone`.

### 3a — CPF como string arbitrária

```json
POST /api/v1/customers
{ "name": "Teste CPF", "document": "abc-invalido", "authorizedTransportTypeIds": [] }

HTTP 201
{ "id": "8f04fb4e-...", "document": "abc-invalido" }
```

### 3b — CPF com apenas 3 dígitos

```json
POST /api/v1/customers
{ "name": "Teste CPF Curto", "document": "123", "authorizedTransportTypeIds": [] }

HTTP 201
{ "id": "a694304f-...", "document": "123" }
```

**Resultado:** FALHA. Qualquer string é aceita como CPF. Não há validação de:
- Formato (XXX.XXX.XXX-XX ou 11 dígitos)
- Dígitos verificadores
- Comprimento mínimo

O campo `phone` aceita `"nao-e-telefone"` sem rejeição.

**DTO atual:**
```typescript
@IsString()
@IsNotEmpty()
document!: string;

@IsString()
@IsOptional()
phone?: string;
```

**Raiz:** Ausência de `@Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)` ou equivalente no `document`, e ausência de validação de formato no `phone`.

---

## Teste 4 — Reagendamento de ordem ENTREGUE

**Cenário:** Ordem avançada pelo ciclo completo até `ENTREGUE`, depois `PUT /sales-orders/:id/schedule` para alterar a data de entrega.

**Sequência:**
```
CRIADA → PLANEJADA → (schedule) → AGENDADA → EM_TRANSPORTE → ENTREGUE
```

**Requisição de reagendamento após ENTREGUE:**
```json
PUT /api/v1/sales-orders/a18045a5-.../schedule
{
  "deliveryDate": "2099-01-01T00:00:00.000Z",
  "windowStart": "2099-01-01T08:00:00.000Z",
  "windowEnd":   "2099-01-01T12:00:00.000Z"
}

HTTP 200
{ "deliveryDate": "2099-01-01T00:00:00.000Z", "rescheduledAt": "2026-06-16T22:06:12.064Z" }
```

**Resultado:** FALHA. Uma ordem entregue teve a data de entrega alterada com sucesso. O sistema permite modificar registros históricos consolidados.

**Raiz:** `RescheduleDeliveryUseCase` verifica apenas se existe um agendamento, sem validar o status atual da ordem. O `ScheduleDeliveryUseCase` valida via `canTransitionTo(AGENDADA)`, mas o de reagendamento não verifica nada equivalente.

```typescript
// reschedule-delivery.use-case.ts — sem validação de status
const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);
if (!existing) {
  throw new DomainException(`Agendamento para ordem ${input.salesOrderId} não encontrado.`);
}
// ← aqui deveria verificar se order.status permite reagendamento
```

---

## Teste 5 — `GET /customers/:id` inexistente

**Cenário:** Consultar cliente por ID via `GET /customers/:id`.

```
GET /api/v1/customers/9b84009b-7fa0-4cd0-be4d-912faa0e8efe

HTTP 404
```

**Resultado:** FALHA. Endpoint não existe. O controller de clientes implementa apenas `POST /`, `GET /` (listar todos) e `PUT /:id`. Não há `GET /:id`.

O JD exige "Consultar" como operação de cliente. A ausência de consulta por ID força o consumidor a listar todos e filtrar no cliente, o que é impraticável em produção sem paginação.

---

## Teste 6 — Campo privado `_status` vazando na resposta

**Cenário:** Consultar qualquer ordem de venda.

```json
GET /api/v1/sales-orders/a18045a5-...

{
  "data": {
    "id": "a18045a5-...",
    "customerId": "...",
    "_status": "ENTREGUE"
  }
}
```

**Resultado:** FALHA. O campo `_status` (prefixo `_` indica membro privado por convenção) vaza diretamente na resposta da API. O campo correto seria `status`.

**Raiz:** `SalesOrderEntity` usa `private _status` com getter `get status()`. O `JSON.stringify` (usado pelo NestJS ao serializar a resposta) não chama getters — serializa o objeto com os campos enumeráveis. Como o getter `status` não é enumerável por padrão em classes TypeScript compiladas, e `_status` é uma propriedade de instância, apenas `_status` aparece.

O contrato público da API expõe um detalhe de implementação interno. Qualquer consumidor da API que persistir esse campo quebrará se a entidade for refatorada.

---

## Teste 7 — N+1 em criação de cliente

**Análise de código:** `src/application/usecases/customer/create-customer.use-case.ts:31`

```typescript
for (const transportTypeId of input.authorizedTransportTypeIds) {
  const transportType = await this.transportTypeRepository.findById(transportTypeId);
  if (!transportType) {
    throw new DomainException(`Tipo de transporte ${transportTypeId} não encontrado.`);
  }
}
```

**Resultado:** CONFIRMADO. Para N tipos de transporte autorizados, são disparadas N queries individuais ao banco. Um cliente com 4 transportes dispara 4 `SELECT * FROM transport_types WHERE id = ?` sequenciais.

**Agravante:** O mesmo codebase já resolve o problema corretamente no `CreateSalesOrderUseCase`:
```typescript
// create-sales-order.use-case.ts:49 — padrão correto, já existente no projeto
const foundItems = await this.itemRepository.findByIds(itemIds);
```

O `ITransportTypeRepository` não tem `findByIds`. O padrão correto existe no projeto mas não foi replicado onde era necessário.

---

## Teste 8 — Auditoria de alteração de transporte

**Cenário:** O JD exige registro de "Alteração de transporte" como evento mínimo de auditoria.

**Evidência 1:** O enum tem o valor declarado:
```typescript
export enum AuditAction {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  DELIVERY_SCHEDULED = 'DELIVERY_SCHEDULED',
  DELIVERY_RESCHEDULED = 'DELIVERY_RESCHEDULED',
  TRANSPORT_CHANGED = 'TRANSPORT_CHANGED',  // ← declarado mas nunca emitido
}
```

**Evidência 2:**
```
PUT /api/v1/sales-orders/:id/transport

HTTP 404
```

Não existe use case, endpoint, nem listener para `TRANSPORT_CHANGED`. O enum foi declarado (possivelmente com intenção de implementar) mas a feature não existe.

**Resultado:** FALHA. Requisito obrigatório do JD ausente. O enum ativo sem implementação é um dead code que engana quem lê o código.

---

## Teste 9 — Race condition no update de status (lost update)

**Cenário:** 5 requisições simultâneas de `PUT /sales-orders/:id/status` com `{"status":"PLANEJADA"}` para a mesma ordem em `CRIADA`.

**Todas as 5 retornaram HTTP 200:**
```
R1: 22:09:06.605 → HTTP 200 _status: PLANEJADA
R2: 22:09:06.611 → HTTP 200 _status: PLANEJADA
R3: 22:09:06.617 → HTTP 200 _status: PLANEJADA
R4: 22:09:06.623 → HTTP 200 _status: PLANEJADA
R5: 22:09:06.629 → HTTP 200 _status: PLANEJADA
```

**Audit log gerado (banco real):**
```
action               | previousState          | currentState           | createdAt
---------------------+------------------------+------------------------+-------------------------
ORDER_CREATED        | null                   | {status: CRIADA}       | 22:09:06.566
ORDER_STATUS_CHANGED | {"status": "CRIADA"}   | {"status": "PLANEJADA"}| 22:09:06.605
ORDER_STATUS_CHANGED | {"status": "CRIADA"}   | {"status": "PLANEJADA"}| 22:09:06.611
ORDER_STATUS_CHANGED | {"status": "CRIADA"}   | {"status": "PLANEJADA"}| 22:09:06.617
ORDER_STATUS_CHANGED | {"status": "CRIADA"}   | {"status": "PLANEJADA"}| 22:09:06.623
ORDER_STATUS_CHANGED | {"status": "CRIADA"}   | {"status": "PLANEJADA"}| 22:09:06.629
```

**Resultado:** FALHA. O estado final é consistente (PLANEJADA), mas:

1. **5 entradas de auditoria para uma única transição.** A rastreabilidade fica corrompida — um auditor veria 5 transições `CRIADA → PLANEJADA` para a mesma ordem.
2. **Sem lock otimista.** O fluxo é: `findById` → `transitionTo` em memória → `update`. Todas as 5 requisições leram `CRIADA` antes de qualquer `update` confirmar, executaram `transitionTo(PLANEJADA)` com sucesso (válido), e todas atualizaram o banco — que aceitou os 5 updates porque não há verificação de versão (`updatedAt` ou campo `version`).
3. **Comportamento perigoso em transições diferentes:** se duas requisições simultâneas tentarem `PLANEJADA → AGENDADA` e `PLANEJADA → (algo inválido)`, dependendo do timing ambas leem `PLANEJADA` e podem executar transições conflitantes.

**Raiz:** Ausência de lock otimista (`WHERE id = ? AND status = 'CRIADA'`) ou campo de versão no `UPDATE`.

---

## Teste 10 — Transição de status inválida

**Cenário:** Tentar avançar status de `CRIADA` diretamente para `ENTREGUE`.

```json
PUT /api/v1/sales-orders/:id/status
{ "status": "ENTREGUE" }

HTTP 422
{
  "message": "Transição inválida: CRIADA → ENTREGUE. Transições permitidas: PLANEJADA",
  "error": "DomainException"
}
```

**Resultado:** OK. A state machine na entidade de domínio rejeita corretamente a transição ilegal antes de tocar o banco. Mensagem de erro clara e útil.

---

## Teste 11 — Bug nas datas de janela (`@db.Time`)

**Cenário:** Agendar entrega com `windowStart` e `windowEnd` como ISO datetime completo.

**Enviado:**
```json
{
  "deliveryDate": "2026-07-01T00:00:00.000Z",
  "windowStart":  "2026-07-01T08:00:00.000Z",
  "windowEnd":    "2026-07-01T12:00:00.000Z"
}
```

**Armazenado e retornado:**
```json
{
  "deliveryDate": "2026-07-01T00:00:00.000Z",
  "windowStart":  "1970-01-01T08:00:00.000Z",
  "windowEnd":    "1970-01-01T12:00:00.000Z"
}
```

**Resultado:** FALHA. A data de `windowStart` e `windowEnd` é descartada silenciosamente. Apenas o horário é preservado, e ao retornar do banco é convertido para o epoch Unix (1970-01-01).

**Raiz:** O schema Prisma define:
```prisma
// src/infrastructure/database/prisma/models/scheduling.prisma
windowStart DateTime @db.Time
windowEnd   DateTime @db.Time
```

`@db.Time` mapeia para o tipo `time` do PostgreSQL, que armazena apenas HH:MM:SS sem data. Ao ler um `time` de volta para JavaScript, o Prisma o converte para `Date` usando a data do epoch (1970-01-01) como base. A correção é `@db.Timestamptz` ou remover a anotação `@db` e usar `DateTime` puro.

---

---

## Customers, Transport Types, Items, Sales Orders — Regras de Negócio

### C5: Remover todos os transportes via update

```json
PUT /api/v1/customers/:id
{ "name": "Cliente Teste", "authorizedTransportTypeIds": [] }

HTTP 200 — authorizedTransportTypeIds: []
```

Aceito. Nenhuma validação impede que um cliente fique sem nenhum transporte autorizado. Após isso, nenhuma OV pode ser criada para o cliente. Comportamento tecnicamente válido mas sem aviso ao consumidor.

---

### O5: Transporte com UUID válido não cadastrado

```json
POST /api/v1/sales-orders
{ "transportTypeId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" }

HTTP 422
{ "message": "Tipo de transporte aaaaaaaa-... não autorizado para o cliente Cliente Teste." }
```

**Parcial.** A mensagem diz "não autorizado" quando o correto seria "não encontrado". O `CreateSalesOrderUseCase` valida o transporte apenas contra a lista do cliente (`isTransportAuthorized`), sem verificar se o transport type existe no banco. Isso obscurece a causa real do erro para o consumidor da API.

---

### O6: Item duplicado no mesmo pedido

```json
POST /api/v1/sales-orders
{ "items": [{ "itemId": "X", "quantity": 1 }, { "itemId": "X", "quantity": 3 }] }

HTTP 422
{ "message": "Itens não encontrados: " }
```

**Falha com mensagem enganosa.** O use case faz `findByIds([X, X])` — o banco retorna 1 registro (deduplicado). Como `1 !== 2`, lança a exceção "não encontrados", mas a lista de ausentes é vazia porque `X` foi encontrado. A mensagem não comunica o problema real (item duplicado no pedido). O schema tem `@@unique([salesOrderId, itemId])` que também bloquearia no banco, mas o use case nunca chega lá.

---

### F2: Filtro `?status=CANCELADA` expõe HTTP 500 + internals do Prisma

```
GET /api/v1/sales-orders?status=CANCELADA

HTTP 500
{
  "message": "Invalid `this.prisma.salesOrder.findMany()` invocation in\n/app/src/infrastructure/repositories/sales-order.repository.ts:66:49\n\nInvalid value for argument `status`. Expected OrderStatus.",
  "error": "InternalServerError"
}
```

**Falha.** O controller declara `@Query('status') status?: OrderStatus` mas o `ValidationPipe` não valida query params por enum — apenas valida body com DTOs anotados. A string `"CANCELADA"` passa direta para o repositório, que repassa ao Prisma, que lança `PrismaClientValidationError`. Esse erro não é tratado no `HttpExceptionFilter`, expondo o caminho interno do arquivo e a query com o valor inválido.

A correção é adicionar `@IsEnum(OrderStatus)` em um DTO de query, ou validar no use case antes de passar ao repositório.

---

### F5: `dateFrom > dateTo` — silencioso

```
GET /api/v1/sales-orders?dateFrom=2026-12-31&dateTo=2026-01-01

HTTP 200 — 0 resultados
```

Retorna 0 resultados sem erro. PostgreSQL avalia `WHERE createdAt >= '2026-12-31' AND createdAt <= '2026-01-01'` e retorna vazio. Sem validação de que `dateFrom <= dateTo`. Um consumidor que inverta as datas por engano recebe uma resposta vazia sem aviso.

---

### R1: Avançar status após remoção do transporte do cliente

Transporte removido do cliente via `PUT /customers/:id`. OV existente avançou para `PLANEJADA` normalmente. A validação de transporte autorizado só ocorre na **criação** da OV. Status updates não revalidam o transporte. Comportamento aceitável por design — a OV é um contrato já firmado no momento da criação.

---

## Testes 17 — Campos extras e payloads malformados

### 17a–17d: Campos não declarados no DTO

**Resultado: OK.** O `ValidationPipe` configurado com `whitelist: true, forbidNonWhitelisted: true` rejeita qualquer campo ausente do DTO com HTTP 400, listando cada propriedade inválida na mensagem:

```json
POST /api/v1/sales-orders
{ "customerId": "...", "status": "ENTREGUE", "id": "00000000-...", "injected": "<script>" }

HTTP 400
{ "message": "property status should not exist, property id should not exist, property createdAt should not exist, property injected should not exist" }
```

Tentativas de forçar `status`, `id`, `createdAt` ou qualquer campo de domínio via payload são bloqueadas antes de chegar ao use case. Campos críticos como `confirmedAt` e `salesOrderId` no schedule também são bloqueados.

---

### 17e: Content-Type incorreto (`text/plain` com JSON no body)

```
POST /api/v1/customers
Content-Type: text/plain
Body: {"name":"Teste","document":"..."}

HTTP 400 — "name should not be empty, document should not be empty..."
```

**Resultado: OK.** Fastify não parseia o body quando o Content-Type não é `application/json`. O body é descartado e a ValidationPipe recebe um objeto vazio, rejeitando por campos obrigatórios ausentes. Não há bypass possível via Content-Type incorreto.

---

### 17g: Prototype Pollution via `__proto__` e `constructor.prototype`

```json
POST /api/v1/customers
{ "name": "...", "__proto__": { "isAdmin": true }, "constructor": { "prototype": { "polluted": true } } }

HTTP 400
{ "message": "Body is not valid JSON but content-type is set to 'application/json'", "traceId": "" }
```

**Resultado: OK (com observação).** O parser JSON do Fastify rejeita corretamente payloads com `__proto__` como chave — comportamento seguro por padrão. Não há prototype pollution.

**Observação:** `traceId` está vazio (`""`) na resposta. O `TraceIdInterceptor` não é executado porque a falha ocorre durante o parsing do body, antes do pipeline NestJS. Requisições que falham nessa fase não têm traceId correlacionável nos logs, dificultando investigação de tentativas de ataque.

---

### 17h–17j: Tipos inválidos em campos numéricos

| Valor | HTTP | Motivo |
|-------|------|--------|
| `quantity: -1` | 400 | `@IsPositive()` |
| `quantity: "dois"` | 400 | `@IsInt()` + `@IsPositive()` |
| `quantity: 1.5` | 400 | `@IsInt()` |
| `quantity: 0` | 400 | `@IsPositive()` |

**Resultado: OK.** Validações numéricas funcionam corretamente.

---

### 17k: `items: []` — array vazio aceito

```json
POST /api/v1/sales-orders
{
  "customerId": "9b84009b-...",
  "transportTypeId": "d9b5c921-...",
  "items": []
}

HTTP 201
{ "id": "c434fe07-...", "items": [], "_status": "CRIADA" }
```

**Resultado: FALHA.** Uma Ordem de Venda foi criada sem nenhum item. O JD define explicitamente: _"Conter ao menos um item"_.

**Raiz:** O DTO tem `@IsArray()` mas não tem `@ArrayMinSize(1)`. O use case não valida `input.items.length > 0` antes de prosseguir. A entidade de domínio também não impede items vazios no constructor.

```typescript
// create-sales-order.dto.ts — falta @ArrayMinSize(1)
@IsArray()
@ValidateNested({ each: true })
@Type((): typeof CreateSalesOrderItemDto => CreateSalesOrderItemDto)
items!: CreateSalesOrderItemDto[];
```

A correção mais adequada seria no DTO (`@ArrayMinSize(1)`) com validação defensiva no use case.

---

## Testes 12–16 — Validação de datas no agendamento

### Teste 12 — Data de entrega no passado

**Cenário:** Agendar ordem com `deliveryDate` em 2020.

```json
POST /api/v1/sales-orders/:id/schedule
{
  "deliveryDate": "2020-01-01T00:00:00.000Z",
  "windowStart":  "2020-01-01T08:00:00.000Z",
  "windowEnd":    "2020-01-01T12:00:00.000Z"
}

HTTP 201
{ "deliveryDate": "2020-01-01T00:00:00.000Z" }
```

**Resultado:** FALHA. Data de entrega em 2020 (6 anos no passado) foi aceita sem nenhuma rejeição. Não há validação de `deliveryDate >= hoje` em nenhuma camada — nem no DTO (`@IsDateString()` apenas valida o formato ISO), nem no use case, nem na entidade de domínio.

**Impacto:** Uma ordem pode ser "agendada" para uma data já ultrapassada, avançar para `AGENDADA` e nunca ser entregue, poluindo o monitoramento operacional com ordens em estado inválido do ponto de vista do negócio.

---

### Teste 13 — Data extremamente futurística (ano 9999)

**Cenário:** Agendar com `deliveryDate: "9999-12-31"`.

```json
POST /api/v1/sales-orders/:id/schedule
{
  "deliveryDate": "9999-12-31T00:00:00.000Z",
  "windowStart":  "9999-12-31T08:00:00.000Z",
  "windowEnd":    "9999-12-31T23:00:00.000Z"
}

HTTP 201
{
  "deliveryDate": "9999-12-31T00:00:00.000Z",
  "windowStart":  "1970-01-01T08:00:00.000Z",
  "windowEnd":    "1970-01-01T23:00:00.000Z"
}
```

**Resultado:** FALHA — dupla. Dois problemas simultâneos:

1. **Ano 9999 aceito sem restrição.** Não há limite superior de data. PostgreSQL suporta `timestamp` até `294276 AD`, então o banco também aceita.
2. **Bug `@db.Time` se manifesta novamente.** `windowStart` e `windowEnd` perdem a data (9999-12-31) e retornam `1970-01-01`. O `deliveryDate` usa `@db.Date` e preserva `9999-12-31` corretamente.

---

### Teste 14 — Ano além do formato ISO 8601 válido (99999)

```json
POST /api/v1/sales-orders/:id/schedule
{
  "deliveryDate": "99999-12-31T00:00:00.000Z",
  ...
}

HTTP 400
{ "message": "deliveryDate must be a valid ISO 8601 date string" }
```

**Resultado:** OK. O validator `@IsDateString()` rejeita anos com 5 dígitos pois não são ISO 8601 válido. Essa é a única barreira de data que funciona — e é puramente sintática, não semântica.

---

### Teste 15 — Janela invertida (`windowEnd < windowStart`)

```json
POST /api/v1/sales-orders/:id/schedule
{
  "deliveryDate": "2026-07-01T00:00:00.000Z",
  "windowStart":  "2026-07-01T18:00:00.000Z",
  "windowEnd":    "2026-07-01T08:00:00.000Z"
}

HTTP 422
{ "message": "Janela de atendimento inválida: início deve ser anterior ao fim." }
```

**Resultado:** OK. O use case valida `windowStart >= windowEnd` e rejeita corretamente.

---

### Teste 16 — Janela com duração zero (`windowStart == windowEnd`)

```json
POST /api/v1/sales-orders/:id/schedule
{
  "deliveryDate": "2026-07-01T00:00:00.000Z",
  "windowStart":  "2026-07-01T08:00:00.000Z",
  "windowEnd":    "2026-07-01T08:00:00.000Z"
}

HTTP 422
{ "message": "Janela de atendimento inválida: início deve ser anterior ao fim." }
```

**Resultado:** OK. A condição `windowStart >= windowEnd` cobre igualdade, rejeitando janelas de duração zero.

---

## Conclusão dos Testes

| Categoria | Encontrado |
|-----------|-----------|
| Bugs funcionais | 8 (reagendamento sem status, `_status` vazando, `@db.Time` descarta data, N+1, data passada aceita, OV criada sem itens, mensagem enganosa em item duplicado, mensagem errada em transporte não cadastrado) |
| Features ausentes | 2 (auditoria de transporte, `GET /customers/:id`) |
| Problemas de segurança/robustez | 4 (idempotência declarada mas ausente, race condition com 5 audit logs duplicados, HTTP 500 com stack trace em status inválido no filtro, HTTP 500 em documento duplicado sob concorrência) |
| Validações ausentes | 4 (CPF/telefone sem formato; `deliveryDate` sem limite semântico; `items` sem `@ArrayMinSize(1)`; `?status` query param sem validação de enum) |
| Comportamentos silenciosos | 2 (`dateFrom > dateTo` retorna vazio sem aviso; `items: []` cria OV silenciosamente) |
| Comportamentos corretos verificados | 22 (fluxo completo de status, todas as transições inválidas, todos os cadastros com validação, agendamento, reagendamento, filtros por cliente/item/data, prototype pollution, `forbidNonWhitelisted`, tipos numéricos, etc.) |

**Bug mais silencioso:** Teste 11 e 13 (`@db.Time`). A API retorna HTTP 201, os dados aparentam estar salvos, mas a data de `windowStart`/`windowEnd` é descartada sem aviso — o consumidor descobre a perda apenas ao ler a resposta com atenção.

**Bug de maior impacto operacional:** Teste 12 (data no passado). Uma ordem pode ser agendada para 2020 e avançar para `AGENDADA`, tornando o monitoramento operacional inútil para detectar atrasos reais — a ordem aparece como "agendada" mas com data vencida há anos.

---

## Avaliação de Qualidade de Código

Análise estática do código-fonte com foco em Design Patterns, SOLID, nomenclatura e padronização. Todos os apontamentos rastreados a arquivo e linha.

---

### Design Patterns

#### Repository Pattern — `implements` vs `extends` inconsistente

Todos os contratos de repositório são `abstract class`. O padrão adotado pelo projeto é `extends`, com `super()` no constructor. `CustomerRepository` é o único que quebra esse padrão:

```
src/infrastructure/repositories/customer.repository.ts:7
export class CustomerRepository implements ICustomerRepository   ← implements, sem super()

src/infrastructure/repositories/sales-order.repository.ts:18
export class SalesOrderRepository extends ISalesOrderRepository  ← extends (correto)

src/infrastructure/repositories/item.repository.ts:7
export class ItemRepository extends IItemRepository              ← extends (correto)

src/infrastructure/repositories/transport-type.repository.ts:7
export class TransportTypeRepository extends ITransportTypeRepository ← extends (correto)
```

Não quebra o runtime — o NestJS resolve o token por referência à classe. Mas indica que o candidato não percebeu que a escolha de `abstract class` como token implica `extends` em toda implementação.

#### Mapper Pattern (`toDomain`) — aplicado em 1 de 5 repositórios

```
src/infrastructure/repositories/sales-order.repository.ts:23
private toDomain(raw: SalesOrderWithRelations): SalesOrderEntity  ← correto

src/infrastructure/repositories/customer.repository.ts
→ mapeamento inline repetido 5x (findById, findByDocument, findAll, create, update)

src/infrastructure/repositories/item.repository.ts
→ mapeamento inline repetido 4x

src/infrastructure/repositories/transport-type.repository.ts
→ mapeamento inline repetido 4x

src/infrastructure/repositories/scheduling.repository.ts
→ mapeamento inline repetido 2x
```

`CustomerRepository` repete o bloco `new CustomerEntity({ id, name, document, ... })` em cada método. Se o construtor mudar, são 5 pontos de edição. O padrão `toDomain()` existe no mesmo projeto mas não foi replicado onde era necessário — inconsistência de aplicação.

#### State Machine — correta, porém domínio sem invariantes no construtor

`VALID_TRANSITIONS` + `transitionTo()` + `canTransitionTo()` em `SalesOrderEntity` estão bem implementados. O problema é que as invariantes de domínio não são protegidas no construtor:

```typescript
// src/domain/entities/sales-order.entity.ts:25
constructor(props: { items: SalesOrderItemEntity[]; ... }) {
  // aceita items: [] sem reclamar — invariante ausente no domínio
}
```

A validação de `items.length > 0` existe apenas no DTO (`@ArrayMinSize` ausente) e deveria também existir na entidade. Se o `CreateSalesOrderUseCase` for chamado diretamente em testes de integração ou outros use cases, o invariante não é enforced.

#### Event-Driven — strings mágicas sem contrato de tipo

```typescript
// src/domain/events/event-emitter.port.ts:2
emit(event: string, payload: unknown): void
```

`'order.created'`, `'order.status.changed'`, `'order.delivery.scheduled'`, `'order.delivery.rescheduled'` são literais espalhadas em 3 use cases e 4 listeners. Um erro de digitação num nome de evento é silencioso — o listener não dispara, sem erro, sem log. O correto é um `const enum` de eventos ou um `Record<EventName, Payload>` tipado para garantir correspondência em compile time.

#### Value Object nomeado como Entity

```typescript
// src/domain/entities/sales-order-item.entity.ts
export class SalesOrderItemEntity {
  // sem id, sem extends BaseEntity
```

`SalesOrderItemEntity` não tem identidade própria (`id`). Por DDD, um objeto sem identidade é um Value Object, não uma Entity. Nomear como `*Entity` é semanticamente incorreto e confunde quem lê o código.

---

### SOLID

#### S — Responsabilidade Única: adequado com uma ressalva

`AuditListener` centraliza 4 handlers (`order.created`, `order.status.changed`, `order.delivery.scheduled`, `order.delivery.rescheduled`) em um único serviço. Cada evento tem um ciclo de vida independente. Para o escopo atual é aceitável, mas ao escalar o domínio, separar listeners por tipo de evento é o padrão recomendado.

#### O — Open/Closed: violação explícita no ExceptionFilter

```typescript
// src/infrastructure/http/filters/http-exception.filter.ts:57
private resolveHttpStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  if (exception instanceof DuplicateRequestException) return HttpStatus.CONFLICT;
  if (exception instanceof DomainNotFoundException) return HttpStatus.NOT_FOUND;
  if (exception instanceof ValidationException) return HttpStatus.BAD_REQUEST;
  // ← cada nova exception exige modificar este método
}
```

Toda nova exception customizada obriga a editar o filter. A solução OCP-compliant é adicionar `toHttpStatus(): number` nas exceptions e o filter chamar `exception.toHttpStatus()`. O mesmo padrão se repete em `resolveErrorName()`.

#### L — Liskov: formalmente correto, inconsistência estrutural

Os `extends I*Repository` satisfazem LSP: todos os métodos abstratos são implementados. O caso `CustomerRepository implements ICustomerRepository` é equivalente em TypeScript mas rompe o contrato semântico do padrão adotado pelo projeto.

#### I — Interface Segregation: violação de baixo impacto

`GetItemsUseCase` injeta `IItemRepository` inteiro mas usa apenas `findAll()`. `CreateItemUseCase` injeta `IItemRepository` mas usa apenas `findBySku()` e `create()`. Cada consumidor recebe uma interface maior do que precisa. Para o porte do projeto, é aceitável — mas o candidato não demonstrou conhecimento do princípio.

#### D — Dependency Inversion: bom, com violação de encapsulamento de módulo

DIP está bem aplicado no sentido domínio/infraestrutura. O problema está nos módulos:

```typescript
// src/presentation/modules/sales-order.module.ts:28-31
{ provide: ICustomerRepository, useClass: CustomerRepository },  // ← pertence a CustomerModule
{ provide: IItemRepository,     useClass: ItemRepository },      // ← pertence a ItemModule
```

`SalesOrderModule` re-registra bindings que são responsabilidade de `CustomerModule` e `ItemModule`. O correto é `SalesOrderModule` importar esses módulos e consumir os providers exportados:

```typescript
@Module({
  imports: [CustomerModule, ItemModule, EventEmitterModule],
  // providers apenas com o que é próprio deste módulo
})
```

Do jeito atual, o DI container instancia providers duplicados e o encapsulamento de módulo é ignorado. Se a implementação concreta mudar, são múltiplos pontos de edição.

---

### Nomenclatura

#### Prefixo `Domain` em exceptions da camada HTTP

```
src/infrastructure/http/exceptions/not-found.exception.ts
export class DomainNotFoundException extends Error

src/infrastructure/http/exceptions/forbidden.exception.ts
export class DomainForbiddenException extends Error

src/infrastructure/http/exceptions/unauthorized.exception.ts
export class DomainUnauthorizedException extends Error
```

Essas classes vivem em `infrastructure/http/exceptions/`. O prefixo `Domain` está errado — conflita semanticamente com a exception de domínio real:

```
src/domain/exceptions/domain.exception.ts
export class DomainException extends Error  ← esta sim é do domínio
```

Lendo `DomainNotFoundException`, a expectativa é que ela esteja no domínio. Nomes corretos: `NotFoundException`, `ForbiddenException`, `UnauthorizedException`.

#### `BusinessRuleException` nunca é lançada (dead code)

```typescript
// src/infrastructure/http/exceptions/business-rule.exception.ts
export class BusinessRuleException extends Error  // ← nenhum use case ou entidade lança isso
```

O `HttpExceptionFilter` trata `BusinessRuleException` como HTTP 422, mas nenhuma parte do código a emite. `DomainException` já cobre regras de negócio com o mesmo status code. `BusinessRuleException` é dead code que cria ambiguidade: quando usar um e quando usar o outro?

#### Campo `id` da ordem com três nomes diferentes nos use cases

```
src/application/usecases/sales-order/update-sales-order-status.use-case.ts:10
interface UpdateSalesOrderStatusInput { orderId: string }       ← orderId

src/application/usecases/sales-order/schedule-delivery.use-case.ts:12
interface ScheduleDeliveryInput { salesOrderId: string }        ← salesOrderId

src/application/usecases/sales-order/reschedule-delivery.use-case.ts:9
interface RescheduleDeliveryInput { salesOrderId: string }      ← salesOrderId

src/application/usecases/sales-order/get-sales-order-by-id.use-case.ts:12
async execute(id: string)                                        ← id
```

O mesmo conceito — ID primário da ordem de venda como entrada do use case — tem três nomes: `orderId`, `salesOrderId`, `id`. O padrão deveria ser `salesOrderId` em todos, por consistência com o domínio.

#### `AuditLogEntity` não estende `BaseEntity`

```typescript
// src/domain/entities/audit-log.entity.ts:3
export class AuditLogEntity {
  readonly id: string;        // ← redeclara campos de BaseEntity
  readonly createdAt: Date;   // ← idem
```

Todas as outras entities estendem `BaseEntity`. `AuditLogEntity` redeclara `id` e `createdAt` manualmente. Inconsistência sem justificativa.

#### Métodos `isConfirmed()` e `isRescheduled()` nunca chamados

```typescript
// src/domain/entities/scheduling.entity.ts:33-38
isConfirmed(): boolean { return !!this.confirmedAt; }
isRescheduled(): boolean { return !!this.rescheduledAt; }
```

Nenhuma parte do código chama esses métodos. Dead code no domínio.

#### Nomes de método com vocabulário de repositório no controller

```typescript
// src/presentation/controllers/v1/customers.controller.ts:45
async findAll()   // ← vocabulário de repositório, não de controller HTTP

// src/presentation/controllers/v1/sales-orders.controller.ts:71
async findById()  // ← idem
```

Controllers REST convencionalmente usam `list()`, `getAll()`, `getOne()` ou `show()`. `findAll` e `findById` são vocabulário de repositório que vazou para a camada de apresentação.

---

### Padronização

#### `toDomain()` ausente em 4 dos 5 repositórios

Detalhado em Design Patterns. O efeito prático: alteração no construtor de `CustomerEntity` exige editar 5 locais em `CustomerRepository`. O padrão correto existe no projeto — não foi replicado.

#### `ScheduleDeliveryDto` e `RescheduleDeliveryDto` são 100% idênticos

```
src/presentation/dtos/sales-order/schedule-delivery.dto.ts
src/presentation/dtos/sales-order/reschedule-delivery.dto.ts

// Ambos têm exatamente:
deliveryDate: string  (@IsDateString @IsNotEmpty)
windowStart: string   (@IsDateString @IsNotEmpty)
windowEnd: string     (@IsDateString @IsNotEmpty)
```

Qualquer mudança de validação exige editar dois arquivos. Poderia ser `RescheduleDeliveryDto extends ScheduleDeliveryDto` ou um único `DeliveryScheduleDto` reutilizado.

#### `statusCode` duplicado no envelope de erro

Respostas de erro têm `statusCode` em dois lugares:

```json
{
  "statusCode": 422,
  "error": {
    "statusCode": 422,   ← duplicado
    "message": "...",
    "error": "DomainException"
  }
}
```

Respostas de sucesso (via `TransformResponseInterceptor`) têm `statusCode` apenas no nível raiz. Schema inconsistente entre sucesso e erro.

#### Módulos sem encapsulamento correto de providers

`SalesOrderModule` re-registra `CustomerRepository`, `ItemRepository` e `SchedulingRepository` diretamente em vez de importar os módulos donos dessas dependências. Detalhado em SOLID/D. Efeito: bindings duplicados, múltiplos pontos de edição ao trocar implementações, módulo que não encapsula sua responsabilidade.

#### `findAll` sem paginação em nenhum endpoint

```typescript
// src/infrastructure/repositories/customer.repository.ts:50
const customers = await this.prisma.customer.findMany();  // ← sem limit/skip

// src/infrastructure/repositories/item.repository.ts:38
const items = await this.prisma.item.findMany();  // ← idem
```

Todos os endpoints de listagem fazem queries ilimitadas. Não há cursor, `skip`/`take` ou page size em nenhum dos 4 recursos. Em produção com volume real, qualquer `GET /sales-orders` pode retornar milhares de registros.

---

### Resumo por dimensão

| Dimensão | Avaliação | Principais problemas |
|---|---|---|
| Design Patterns | Aplicado com falhas de consistência | `toDomain()` só em 1 de 5 repos; `implements` vs `extends`; eventos como strings mágicas; Value Object nomeado como Entity |
| SOLID | S e L adequados; O, I e D com violações | OCP violado no filter; módulos re-registrando providers alheios (D); ISP ignorado |
| Nomenclatura | Bom em geral com problemas pontuais relevantes | `orderId`/`salesOrderId`/`id` para o mesmo conceito; prefixo `Domain` em exceptions HTTP; `BusinessRuleException` dead code; `AuditLogEntity` sem `extends` |
| Padronização | Inconsistências transversais | `toDomain()` ausente em 4 repositórios; DTOs de schedule duplicados; `statusCode` duplo na resposta de erro; módulos sem encapsulamento; `findAll` sem paginação |

O código demonstra conhecimento dos padrões, mas com aplicação irregular: aplica corretamente em um lugar e omite no análogo imediato. É o sinal de quem assimilou o conceito mas ainda não tem o reflexo automático de verificar consistência entre peças similares do projeto.

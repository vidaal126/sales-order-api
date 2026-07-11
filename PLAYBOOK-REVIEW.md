# Playbook Review — sales-order-api

Revisão técnica completa baseada nas regras do Engineering Playbook.
Data: 2026-06-18 | Revisor: Claude (engineering-code-review + engineering-playbook)

---

## Sumário executivo

O projeto demonstra boa intenção arquitetural (hexagonal, camadas separadas, DI via tokens, auditoria por eventos, observabilidade). Os pontos positivos são reais. Mas há violações diretas das regras não-negociáveis do playbook — N+1, queries sem paginação, segredos commitados, race conditions sem transação, e a classe de erro `DomainNotFoundException` que existe mas nunca é usada (fazendo toda busca por recurso inexistente retornar 422 em vez de 404).

---

## O que o Playbook Reprovaria

Violações das regras não-negociáveis. Cada item mostra onde o código falha e como deveria ficar.

---

### Regra: No N+1

#### `create-customer.use-case.ts:31-36` e `update-customer.use-case.ts:31-36`

**Ponto de falha:**
```typescript
// create-customer.use-case.ts:31
for (const transportTypeId of input.authorizedTransportTypeIds) {
  const transportType = await this.transportTypeRepository.findById(transportTypeId);
  if (!transportType) {
    throw new DomainException(`Tipo de transporte ${transportTypeId} não encontrado.`);
  }
}
```
Uma query ao banco por `transportTypeId` do array. Com 5 tipos de transporte: 5 queries. `ITransportTypeRepository` não tem `findByIds`, então o port força o N+1.

**Como deveria ser:**
Adicionar `findByIds` ao port e fazer uma única query:
```typescript
// domain/repositories/transport-type.repository.ts
abstract findByIds(ids: string[]): Promise<TransportTypeEntity[]>;

// create-customer.use-case.ts
const found = await this.transportTypeRepository.findByIds(input.authorizedTransportTypeIds);
if (found.length !== input.authorizedTransportTypeIds.length) {
  const missing = input.authorizedTransportTypeIds.filter(
    (id) => !found.some((t) => t.id === id),
  );
  throw new DomainException(`Tipos de transporte não encontrados: ${missing.join(', ')}`);
}
```

---

### Regra: No Unbounded Queries

#### `customer.repository.ts:50`, `item.repository.ts:38`, `sales-order.repository.ts:65`

**Ponto de falha:**
```typescript
// customer.repository.ts:50
async findAll(): Promise<CustomerEntity[]> {
  const customers = await this.prisma.customer.findMany({
    include: { authorizedTransports: true },
  });
  // sem take, sem skip, sem cursor
}
```
```typescript
// sales-order.repository.ts:65
const orders = await this.prisma.salesOrder.findMany({
  where: { ... },
  include: { items: true, scheduling: true },
  orderBy: { createdAt: 'desc' },
  // sem limite
});
```

**Como deveria ser:**
Os ports precisam aceitar paginação e os repositórios aplicar um limite padrão:
```typescript
// domain/repositories/sales-order.repository.ts
export interface SalesOrderFilters {
  status?: OrderStatus;
  customerId?: string;
  // ...
  page?: number;
  limit?: number;
}

// sales-order.repository.ts
const PAGE_SIZE = 50;
const orders = await this.prisma.salesOrder.findMany({
  where: { ... },
  take: filters?.limit ?? PAGE_SIZE,
  skip: filters?.page ? (filters.page - 1) * (filters?.limit ?? PAGE_SIZE) : 0,
  orderBy: { createdAt: 'desc' },
});
```

---

### Regra: No Dead Code

#### `DomainNotFoundException` — nunca lançada

**Ponto de falha:**
```typescript
// http-exception.filter.ts:61
if (exception instanceof DomainNotFoundException) return HttpStatus.NOT_FOUND;
// ↑ mapeamento correto existe no filter

// get-sales-order-by-id.use-case.ts:14
if (!order) {
  throw new DomainException(`Ordem de venda ${id} não encontrada.`);
  //    ↑ lança DomainException → 422, não DomainNotFoundException → 404
}
```
O filter sabe diferenciar `DomainNotFoundException` de `DomainException`, mas nenhum use case usa `DomainNotFoundException`. O resultado é HTTP 422 para todo recurso não encontrado.

**Como deveria ser:**
```typescript
// get-sales-order-by-id.use-case.ts
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';

if (!order) {
  throw new DomainNotFoundException(`Ordem de venda ${id} não encontrada.`);
}
```
Aplicar o mesmo em: `update-sales-order-status`, `schedule-delivery`, `reschedule-delivery`, `create-sales-order` (customer/items not found).

#### `DuplicateRequestException` — feature declarada, não implementada

**Ponto de falha:**
```typescript
// http-exception.filter.ts:44-46
if (exception instanceof DuplicateRequestException) {
  void reply.header('X-Resource-Id', exception.existingResourceId);
}
// ↑ o filter lida com ela

// Nenhum use case, middleware ou guard lança DuplicateRequestException.
// O header Idempotency-Key está no CORS allowedHeaders mas não é processado.
```
A infraestrutura de idempotência existe no papel (exception + handler no filter) mas não está conectada a nenhum fluxo real.

**Como deveria ser:**
Ou implementar o middleware de idempotência (guard que lê `Idempotency-Key`, consulta cache/DB, retorna resposta anterior se já processado), ou remover `DuplicateRequestException`, o tratamento no filter e o header do CORS. Manter código morto é violação direta do playbook.

#### `SchedulingEntity.isConfirmed()` e `isRescheduled()` — não chamados

**Ponto de falha:**
```typescript
// scheduling.entity.ts:33
isConfirmed(): boolean { return !!this.confirmedAt; }
isRescheduled(): boolean { return !!this.rescheduledAt; }
```
Definidos na entidade, não referenciados em nenhum lugar.

**Como deveria ser:**
Remover os dois métodos até que haja um caso de uso real que os necessite, ou usá-los nas validações de `RescheduleDeliveryUseCase` (que hoje não verifica se a ordem está em estado reagendável).

---

### Regra: No Hardcoded Secrets

#### `.env` commitado ao repositório

**Ponto de falha:**
```
# .env (rastreado pelo git)
POSTGRESQL_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_order_db
```
Arquivo com credenciais reais está versionado. Qualquer clone do repo expõe as credenciais.

**Como deveria ser:**
```
# .gitignore
.env
.env.local
.env.*.local
```
Somente `.env.example` (sem valores reais) deve ser commitado. O `.env` real fica fora do controle de versão e é preenchido por CI/CD ou por cada developer localmente.

---

### Regra: Multiple Repository Writes Without Transaction

#### `schedule-delivery.use-case.ts:61-64`

**Ponto de falha:**
```typescript
const created = await this.schedulingRepository.create(scheduling); // write 1
order.transitionTo(OrderStatus.AGENDADA);
await this.salesOrderRepository.update(order); // write 2 — sem atomicidade
```
Se o segundo write falhar (timeout, constraint), o scheduling existe no banco mas a ordem continua em `PLANEJADA`. O estado é inconsistente e não há como detectar isso.

**Como deveria ser:**
Os repositórios precisam aceitar um cliente transacional opcional, ou o use case precisa acessar o `PrismaService` para criar a transação. A solução mais limpa sem violar a arquitetura é passar o client de transação como argumento:
```typescript
// Alternativa: expor $transaction via port de unit of work
await this.prisma.$transaction(async (tx) => {
  await this.schedulingRepository.create(scheduling, tx);
  order.transitionTo(OrderStatus.AGENDADA);
  await this.salesOrderRepository.update(order, tx);
});
```

---

### Regra: process.env fora do módulo de configuração

#### `prisma.service.ts:8`

**Ponto de falha:**
```typescript
// prisma.service.ts:8
constructor() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set');
```
`process.env` acessado diretamente no construtor de um serviço NestJS, bypassa o `ConfigModule` e pode ser executado antes da validação do schema Joi.

**Como deveria ser:**
O `PrismaService` é um provider singleton. `ConfigService` pode ser injetado, mas há um problema de bootstrap order — `PrismaService` é necessário antes do `ConfigService` em alguns contextos. A solução padrão é ler do `ConfigService` quando disponível, ou aceitar o acesso em `onModuleInit`:
```typescript
// Opção 1: manter o acesso direto mas depois da validação do Joi (aceitável)
// A validação do Joi no AppModule.forRoot() já garante que DATABASE_URL existe.
// O acesso em processo de bootstrap é tolerável SE o schema Joi valida primeiro.
// Documentar explicitamente o motivo no código.

// Opção 2: clean
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    const databaseUrl = config.get<string>('DATABASE_URL')!;
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });
  }
}
```

---

### Regra: Business Rule in Use Case

#### Duplicação de invariante em `schedule-delivery` e `reschedule-delivery`

**Ponto de falha:**
```typescript
// schedule-delivery.use-case.ts:46
if (input.windowStart >= input.windowEnd) {
  throw new DomainException('Janela de atendimento inválida...');
}

// reschedule-delivery.use-case.ts:30 — cópia exata
if (input.windowStart >= input.windowEnd) {
  throw new DomainException('Janela de atendimento inválida...');
}
```
Invariante de domínio duplicada em dois use cases. Qualquer terceiro use case que manipule `SchedulingEntity` vai precisar replicar essa lógica.

**Como deveria ser:**
```typescript
// scheduling.entity.ts — no construtor ou factory
constructor(props: { ... }) {
  if (props.windowStart >= props.windowEnd) {
    throw new DomainException('Janela de atendimento inválida: início deve ser anterior ao fim.');
  }
  // ...
}
```
Os use cases apenas constroem a entidade — a invariante é protegida automaticamente. Os `if` dos use cases são removidos.

---

### Regra: Entity Constructor Must Be Private (+ reconstitute vs create)

#### Todos os domain entities

**Ponto de falha:**
```typescript
// sales-order.entity.ts:25
constructor(props: { id: string; customerId: string; ... }) {
  // construtor público
}

// sales-order.repository.ts — reconstrução do banco
return new SalesOrderEntity({ id: raw.id, ... }); // mesmo construtor da criação

// create-sales-order.use-case.ts — criação de negócio
const order = new SalesOrderEntity({ id: randomUUID(), ... }); // mesmo construtor
```
Criação de negócio e reconstrução de persistência usam o mesmo construtor público. Não há distinção entre os dois ciclos de vida — qualquer código pode construir a entidade com qualquer estado.

**Como deveria ser:**
```typescript
// sales-order.entity.ts
export class SalesOrderEntity extends BaseEntity {
  private constructor(props: SalesOrderProps) { ... }

  static place(props: Omit<SalesOrderProps, 'id' | 'createdAt' | 'updatedAt' | 'status'>): SalesOrderEntity {
    return new SalesOrderEntity({
      ...props,
      id: randomUUID(),
      status: OrderStatus.CRIADA,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: SalesOrderProps): SalesOrderEntity {
    return new SalesOrderEntity(props); // sem defaults, sem regras de criação
  }
}

// use-case:
const order = SalesOrderEntity.place({ customerId, transportTypeId, items });

// repository mapper:
return SalesOrderEntity.reconstitute({ id: raw.id, status: raw.status as OrderStatus, ... });
```

---

### Regra: Entity Identity Lost in Mapper

#### `sales-order.repository.ts:33-37`

**Ponto de falha:**
```typescript
items: raw.items.map(
  (item): SalesOrderItemEntity =>
    new SalesOrderItemEntity({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      // ← item.id nunca mapeado
    }),
),
```
O `id` próprio de cada `SalesOrderItem` (PK na tabela) é descartado na reconstrução. Se no futuro for necessário atualizar ou remover um item específico, não há como referenciar sua linha no banco.

**Como deveria ser:**
```typescript
// sales-order-item.entity.ts — adicionar id ao construtor
new SalesOrderItemEntity({
  id: item.id,         // ← PK preservada
  itemId: item.itemId,
  quantity: item.quantity,
  unitPrice: Number(item.unitPrice),
})
```

---

## Blockers

### B1 — Race condition em `ScheduleDeliveryUseCase`

**`src/application/usecases/sales-order/schedule-delivery.use-case.ts:41-64`**

**Ponto de falha:**
```typescript
const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId); // read
if (existing) throw ...;        // check

// ← janela de race: outra request passa aqui simultaneamente

const created = await this.schedulingRepository.create(scheduling); // write 1
order.transitionTo(OrderStatus.AGENDADA);
await this.salesOrderRepository.update(order);                      // write 2
```
Duas requests simultâneas passam pelo check de existência antes de qualquer uma persistir. A constraint de unicidade no banco vai rejeitar a segunda, mas nesse ponto `order._status` já foi mutado em memória na primeira request.

**Como deveria ser:**
```typescript
async execute(input: ScheduleDeliveryInput): Promise<SchedulingEntity> {
  return this.prisma.$transaction(async (tx) => {
    const order = await this.salesOrderRepository.findById(input.salesOrderId, tx);
    // ... validações
    const created = await this.schedulingRepository.create(scheduling, tx);
    order.transitionTo(OrderStatus.AGENDADA);
    await this.salesOrderRepository.update(order, tx);
    return created;
  });
}
```

---

### B2 — HTTP 422 para todos os cenários de recurso não encontrado

**Ponto de falha:**
```typescript
// get-sales-order-by-id.use-case.ts:14
if (!order) throw new DomainException(`Ordem de venda ${id} não encontrada.`);
//                    ↑ DomainException → filter → 422 UNPROCESSABLE_ENTITY
```
`DomainNotFoundException` existe, o filter a mapeia para 404, mas nenhum use case a usa.

**Como deveria ser:**
```typescript
// get-sales-order-by-id.use-case.ts
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';

if (!order) throw new DomainNotFoundException(`Ordem de venda ${id} não encontrada.`);
//                    ↑ DomainNotFoundException → filter → 404 NOT_FOUND
```
Arquivos a corrigir:
- `get-sales-order-by-id.use-case.ts:14`
- `update-sales-order-status.use-case.ts:27`
- `schedule-delivery.use-case.ts:32`
- `reschedule-delivery.use-case.ts:26`
- `create-sales-order.use-case.ts:39` (customer not found)
- `create-sales-order.use-case.ts:53` (items not found)

---

### B3 — `ThrottlerBehindProxyGuard` com bucket compartilhado

**`src/infrastructure/http/guards/throttler-behind-proxy.guard.ts:8`**

**Ponto de falha:**
```typescript
protected getTracker(req: Record<string, unknown>): Promise<string> {
  const forwarded = req.headers as Record<string, string>;
  const ip = forwarded?.['x-forwarded-for'] ?? '';
  return Promise.resolve(ip);  // ← '' quando não há proxy
}
```
Conexões diretas (sem `x-forwarded-for`) retornam `''`. Todos esses requests compartilham um único bucket de rate limit. Na prática: ou o throttler bloqueia todo tráfego direto junto, ou um atacante sem o header tem limite compartilhado com tráfego legítimo.

Outro problema: `x-forwarded-for` pode vir como `"client_ip, proxy1, proxy2"`. O string completo vira a chave, então dois clientes pelo mesmo proxy teriam a mesma chave.

**Como deveria ser:**
```typescript
protected getTracker(req: Record<string, unknown>): Promise<string> {
  const headers = req.headers as Record<string, string | string[]>;
  const forwarded = headers['x-forwarded-for'];
  const firstIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();
  const ip = firstIp ?? (req as unknown as FastifyRequest).ip;
  return Promise.resolve(ip);
}
```

---

### B4 — `RescheduleDeliveryUseCase` sem validação de status da ordem

**`src/application/usecases/sales-order/reschedule-delivery.use-case.ts`**

**Ponto de falha:**
```typescript
async execute(input: RescheduleDeliveryInput): Promise<SchedulingEntity> {
  const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);
  if (!existing) throw new DomainException('Agendamento ... não encontrado.');
  // ← não verifica o status atual da ordem
  // uma ordem EM_TRANSPORTE ou ENTREGUE pode ser reagendada
```

**Como deveria ser:**
```typescript
const order = await this.salesOrderRepository.findById(input.salesOrderId);
if (!order) throw new DomainNotFoundException(...);

if (order.status !== OrderStatus.AGENDADA) {
  throw new DomainException(
    `Não é possível reagendar uma ordem no status ${order.status}. Esperado: AGENDADA.`,
  );
}

const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);
if (!existing) throw new DomainNotFoundException(...);
```

---

### B5 — `SalesOrderRepository.findAll()` — enum inválido causa HTTP 500

**`src/infrastructure/repositories/sales-order.repository.ts:66`**

**Ponto de falha (erro observado em produção):**
```json
{
  "message": "Invalid `this.prisma.salesOrder.findMany()` invocation in
  /app/src/infrastructure/repositories/sales-order.repository.ts:66:49
  Invalid value for argument `status`. Expected OrderStatus.",
  "error": "InternalServerError"
}
```

```typescript
// sales-orders.controller.ts:51
async findAll(
  @Query('status') status?: OrderStatus,  // ← sem validação: qualquer string passa
  ...
)

// sales-order.repository.ts:66
where: {
  status: filters?.status,  // ← string inválida chega aqui e Prisma rejeita
```

O `@Query` sem DTO não passa pela `ValidationPipe`. `enableImplicitConversion: true` não converte strings para enums — apenas primitivos. Um valor inválido como `?status=criada` (minúsculo) ou `?status=qualquer` chega ao Prisma e causa 500.

**Como deveria ser:**
Criar um DTO de query com `@IsEnum`:
```typescript
// dtos/sales-order/get-sales-orders-query.dto.ts
export class GetSalesOrdersQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @IsUUID('4')
  @IsOptional()
  transportTypeId?: string;

  @IsUUID('4')
  @IsOptional()
  itemId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

// sales-orders.controller.ts
async findAll(@Query() query: GetSalesOrdersQueryDto): Promise<SalesOrderEntity[]> {
  return this.getSalesOrdersUseCase.execute({
    ...query,
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
  });
}
```

---

## Major

### M1 — N+1 em `CreateCustomerUseCase` e `UpdateCustomerUseCase`

Detalhado na seção "O que o Playbook Reprovaria". Root cause: `ITransportTypeRepository` não tem `findByIds`.

---

### M2 — Queries sem paginação

**Ponto de falha:**
```typescript
// Três repositórios com o mesmo problema
async findAll(): Promise<CustomerEntity[]> {
  return this.prisma.customer.findMany({ include: { authorizedTransports: true } });
  // sem take, skip, cursor
}
```

**Como deveria ser:**
Conforme descrito em "No Unbounded Queries". Mínimo: `take: 50` como cap, idealmente cursor-based pagination.

---

### M3 — `AuditListener` sem tratamento de erro

**Ponto de falha:**
```typescript
// audit.listener.ts:15
@OnEvent('order.created')
async handleOrderCreated(event: { ... }): Promise<void> {
  await this.auditLogRepository.create(...);
  // ← sem try/catch: falha de DB = exceção não tratada dentro do EventEmitter2
}
```

**Como deveria ser:**
```typescript
@OnEvent('order.created')
async handleOrderCreated(event: { orderId: string; customerId: string; status: string }): Promise<void> {
  try {
    await this.auditLogRepository.create(
      new AuditLogEntity({ ... }),
    );
  } catch (err) {
    this.logger.error({ err, orderId: event.orderId }, 'Failed to persist audit log for order.created');
  }
}
```

---

### M4 — `/metrics` sem autenticação

**Ponto de falha:**
```typescript
// main.ts:87
server.get('/metrics', async (_request, reply): Promise<void> => {
  reply.header('Content-Type', register.contentType);
  await reply.send(await register.metrics());
  // ← registro direto no Fastify, fora do pipeline NestJS, sem guard, sem throttler
});
```

**Como deveria ser:**
Em produção, o endpoint de métricas deve ser protegido. A solução mais simples:
```typescript
server.get('/metrics', async (request, reply): Promise<void> => {
  const token = request.headers['authorization'];
  const expected = `Bearer ${config.get<string>('METRICS_TOKEN')}`;
  if (token !== expected) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  reply.header('Content-Type', register.contentType);
  await reply.send(await register.metrics());
});
```
Ou mover para uma porta interna separada via `app.listen(metricsPort, '127.0.0.1')`.

---

### M5 — Cobertura de testes insuficiente

**Ponto de falha:**
Use cases sem nenhum teste:
- `ScheduleDeliveryUseCase` — cobre o fluxo principal do produto
- `RescheduleDeliveryUseCase` — inclui o bug B4 (status não validado)
- `UpdateSalesOrderStatusUseCase` — máquina de estados é o core do domínio
- `GetSalesOrderByIdUseCase` — sem teste para o caminho de não encontrado

O teste unitário de `CreateSalesOrderUseCase` não valida o conteúdo do pedido criado:
```typescript
// create-sales-order.use-case.spec.ts:131
expect(mockSalesOrderRepository.create).toHaveBeenCalledOnce();
// ↑ verifica que foi chamado, mas não valida o que foi passado
// preço unitário, items, customerId — nada é assertado
```

**Como deveria ser:**
```typescript
expect(mockSalesOrderRepository.create).toHaveBeenCalledWith(
  expect.objectContaining({
    customerId: 'customer-id',
    transportTypeId: 'transport-id',
    items: expect.arrayContaining([
      expect.objectContaining({ itemId: 'item-id', quantity: 2, unitPrice: 29.9 }),
    ]),
  }),
);
```

---

### M6 — `SalesOrderItemEntity` perde ID na reconstrução

Detalhado na seção "O que o Playbook Reprovaria".

---

## Minor

### N1 — `@ApiResponse` ausente em todos os endpoints

**Ponto de falha:**
```typescript
@Post()
@ApiOperation({ summary: 'Criar ordem de venda' })
async create(@Body() dto: CreateSalesOrderDto): Promise<SalesOrderEntity> {
// ← sem @ApiCreatedResponse, @ApiBadRequestResponse, @ApiUnprocessableEntityResponse
```

**Como deveria ser:**
```typescript
@Post()
@ApiOperation({ summary: 'Criar ordem de venda' })
@ApiCreatedResponse({ description: 'Ordem criada', type: SalesOrderResponseDto })
@ApiBadRequestResponse({ description: 'Payload inválido' })
@ApiUnprocessableEntityResponse({ description: 'Regra de negócio violada' })
async create(@Body() dto: CreateSalesOrderDto): Promise<SalesOrderEntity> {
```

---

### N2 — `@MaxLength` ausente em campos de texto livre

**Ponto de falha:**
```typescript
// create-customer.dto.ts
@IsString()
@IsNotEmpty()
name!: string;  // ← aceita string de qualquer tamanho
```

**Como deveria ser:**
```typescript
@IsString()
@IsNotEmpty()
@MaxLength(150)
name!: string;

@IsString()
@IsNotEmpty()
@MaxLength(20)
document!: string;
```

---

### N3 — `ScheduleDeliveryDto` não valida data no passado

**Ponto de falha:**
```typescript
@IsDateString()
@IsNotEmpty()
deliveryDate!: string;  // ← aceita '2020-01-01'
```

**Como deveria ser:**
```typescript
@IsDateString()
@IsNotEmpty()
@MinDate(new Date())  // de class-validator
deliveryDate!: string;
```

---

### N4 — `/health` referenciado mas inexistente

**Ponto de falha:**
```typescript
// app.module.ts:51
autoLogging: {
  ignore: (req: IncomingMessage): boolean => req.url === '/health',
},
```
Nenhum endpoint `/health` existe no projeto. A regra de supressão de logs nunca dispara.

**Como deveria ser:**
Ou criar o endpoint `/health` (recomendado — útil para Kubernetes liveness probe), ou remover a regra de ignore.

---

### N5 — `OrderStatus.PLANEJADA` sem use case dedicado

**Ponto de falha:**
```typescript
// O único caminho para PLANEJADA é via endpoint genérico:
PUT /api/v1/sales-orders/:id/status
{ "status": "PLANEJADA" }
```
Não existe `PlanSalesOrderUseCase`. A semântica de "planejar uma ordem" está implícita em um endpoint genérico que aceita qualquer status.

**Como deveria ser:**
Criar `PlanSalesOrderUseCase` com as regras específicas do que significa "planejar" (ex: validações de estoque, alocação de transporte), ou documentar explicitamente que a transição para `PLANEJADA` é intencional via endpoint genérico de status.

---

### N6 — Cleanup de integration test frágil

**Ponto de falha:**
```typescript
// create-sales-order.use-case.integration.spec.ts:63
afterAll(async () => {
  await prisma.salesOrderItem.deleteMany({ where: { itemId } }); // se falhar, as próximas não rodam
  await prisma.salesOrder.deleteMany({ where: { customerId } });
  await prisma.item.delete({ where: { id: itemId } });
  // ...
});
```

**Como deveria ser:**
```typescript
afterAll(async () => {
  await prisma.$transaction([
    prisma.salesOrderItem.deleteMany({ where: { itemId } }),
    prisma.salesOrder.deleteMany({ where: { customerId } }),
    prisma.item.delete({ where: { id: itemId } }),
    prisma.customerTransportType.deleteMany({ where: { customerId } }),
    prisma.customer.delete({ where: { id: customerId } }),
    prisma.transportType.delete({ where: { id: transportTypeId } }),
  ]);
  await prisma.$disconnect();
  await module.close();
});
```
Ou usar `prisma.$executeRaw('TRUNCATE ... CASCADE')` em ambiente de teste.

---

## Design Patterns, Nomenclatura e Padronização

### DP1 — Open/Closed Principle: `HttpExceptionFilter.resolveHttpStatus`

**Ponto de falha:**
```typescript
// http-exception.filter.ts:57
private resolveHttpStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  if (exception instanceof DuplicateRequestException) return HttpStatus.CONFLICT;
  if (exception instanceof DomainNotFoundException) return HttpStatus.NOT_FOUND;
  if (exception instanceof ValidationException) return HttpStatus.BAD_REQUEST;
  if (exception instanceof DomainUnauthorizedException) return HttpStatus.UNAUTHORIZED;
  if (exception instanceof DomainForbiddenException) return HttpStatus.FORBIDDEN;
  if (exception instanceof BusinessRuleException) return HttpStatus.UNPROCESSABLE_ENTITY;
  if (exception instanceof ExternalServiceException) return HttpStatus.BAD_GATEWAY;
  if (exception instanceof DomainException) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
```
Cada nova exception exige modificar este método. Viola OCP: aberto para extensão, fechado para modificação.

**Como deveria ser:**
```typescript
private static readonly STATUS_MAP: Array<[new (...args: unknown[]) => unknown, number]> = [
  [DomainNotFoundException,      HttpStatus.NOT_FOUND],
  [ValidationException,          HttpStatus.BAD_REQUEST],
  [DomainUnauthorizedException,  HttpStatus.UNAUTHORIZED],
  [DomainForbiddenException,     HttpStatus.FORBIDDEN],
  [DuplicateRequestException,    HttpStatus.CONFLICT],
  [BusinessRuleException,        HttpStatus.UNPROCESSABLE_ENTITY],
  [ExternalServiceException,     HttpStatus.BAD_GATEWAY],
  [DomainException,              HttpStatus.UNPROCESSABLE_ENTITY],
];

private resolveHttpStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  const match = HttpExceptionFilter.STATUS_MAP.find(([type]) => exception instanceof type);
  return match ? match[1] : HttpStatus.INTERNAL_SERVER_ERROR;
}
```
Nova exception = nova linha no mapa. O método `resolveHttpStatus` nunca precisa ser tocado.

---

### DP2 — `CustomerRepository implements` em vez de `extends` — quebra de padronização

**Ponto de falha:**
```typescript
// customer.repository.ts (infrastructure)
export class CustomerRepository implements ICustomerRepository { ... }
//                           ↑ implements

// Os outros 5 repositórios do projeto:
export class SalesOrderRepository  extends ISalesOrderRepository  { ... }
export class ItemRepository        extends IItemRepository        { ... }
export class SchedulingRepository  extends ISchedulingRepository  { ... }
export class AuditLogRepository    extends IAuditLogRepository    { ... }
export class TransportTypeRepository extends ITransportTypeRepository { ... }
//                                   ↑ extends
```
`ICustomerRepository` é `abstract class` (confirmado em `domain/repositories/customer.repository.ts`). Usar `implements` com uma classe abstrata é válido em TypeScript mas semanticamente errado — e quebra o padrão de todos os outros 5 repositórios do projeto.

**Como deveria ser:**
```typescript
export class CustomerRepository extends ICustomerRepository { ... }
```

---

### DP3 — `SalesOrderItemEntity` e `AuditLogEntity` não estendem `BaseEntity`

**Ponto de falha:**
```typescript
// sales-order-item.entity.ts:1
export class SalesOrderItemEntity {   // sem BaseEntity, sem id, sem createdAt
  readonly itemId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

// audit-log.entity.ts:3
export class AuditLogEntity {         // sem BaseEntity
  readonly id: string;                // id redefinido inline
  readonly createdAt: Date;           // createdAt redefinido inline
}
```
As outras 5 entidades (`SalesOrderEntity`, `CustomerEntity`, `ItemEntity`, `SchedulingEntity`, `TransportTypeEntity`) estendem `BaseEntity`. `SalesOrderItemEntity` não tem `id` algum. `AuditLogEntity` duplica os campos de `BaseEntity` sem herdar dela.

**Como deveria ser:**
```typescript
export class SalesOrderItemEntity extends BaseEntity {
  constructor(props: { id: string; itemId: string; quantity: number; unitPrice: number; createdAt: Date }) {
    super(props.id, props.createdAt);
    // ...
  }
}

export class AuditLogEntity extends BaseEntity {
  constructor(props: { id: string; createdAt: Date; ... }) {
    super(props.id, props.createdAt);
    // ...
  }
}
```

---

### DP4 — `DomainException` sem hierarquia semântica

**Ponto de falha:**
```typescript
// A mesma classe é lançada para 4 categorias distintas de erro:
throw new DomainException(`Cliente ${id} não encontrado.`);          // deveria ser 404
throw new DomainException(`Tipo de transporte não autorizado.`);     // regra de negócio 422
throw new DomainException(`Janela de atendimento inválida.`);        // validação 422
throw new DomainException(`Transição inválida: ENTREGUE → CRIADA`);  // invariante de estado 422
```
O filter mapeia `DomainException` para 422 — catch-all que engloba inclusive "não encontrado". Resultado: HTTP 422 para recurso inexistente em vez de 404 (Blocker B2 é consequência direta deste design).

**Como deveria ser:**
```typescript
export class DomainException extends Error { ... }                    // base — 422

export class DomainNotFoundException    extends DomainException { }  // 404
export class DomainValidationException  extends DomainException { }  // 400
export class DomainStateException       extends DomainException { }  // 422 (state machine)
export class DomainAuthorizationException extends DomainException { } // 403
```
Com a hierarquia, o filter usa `instanceof` por subclasse e o status HTTP correto é inferido sem ambiguidade.

---

### DP5 — Magic string `'SalesOrder'` hardcoded em 4 handlers

**Ponto de falha:**
```typescript
// audit.listener.ts:22, :41, :59, :78
entityType: 'SalesOrder',
```
Literal hardcoded repetido 4 vezes. Qualquer alteração no padrão de `entityType` exige busca manual.

**Como deveria ser:**
```typescript
// Uma constante no topo do arquivo ou exportada da entidade
const SALES_ORDER_ENTITY = SalesOrderEntity.name; // 'SalesOrderEntity'
// ou
const SALES_ORDER_ENTITY = 'SalesOrder' as const;

entityType: SALES_ORDER_ENTITY,
```

---

### N8 — Parâmetros de uma letra em callbacks — abreviação proibida

**Ponto de falha:**
```typescript
// customer.repository.ts:24, :65, :97 (3 ocorrências)
customer.authorizedTransports.map((t): string => t.transportTypeId)

// transport-type.repository.ts:39
transportTypes.map((t): TransportTypeEntity => new TransportTypeEntity({...}))

// item.repository.ts:38, :53 (2 ocorrências)
items.map((i): ItemEntity => new ItemEntity({...}))

// create-sales-order.use-case.ts:59
foundItems.find((i): boolean => i.id === inputItem.itemId)
```
`t` e `i` são abreviações. A regra do playbook é: parâmetro nomeado pelo que representa, não por economia de caracteres.

**Como deveria ser:**
```typescript
customer.authorizedTransports.map((transport): string => transport.transportTypeId)
transportTypes.map((transportType): TransportTypeEntity => new TransportTypeEntity({...}))
items.map((item): ItemEntity => new ItemEntity({...}))
foundItems.find((item): boolean => item.id === inputItem.itemId)
```

---

### N9 — `existing` como nome de variável — genérico, repetido em 4 use cases

**Ponto de falha:**
```typescript
// create-customer.use-case.ts:26
const existing = await this.customerRepository.findByDocument(input.document);

// update-customer.use-case.ts:25
const existing = await this.customerRepository.findById(input.id);

// schedule-delivery.use-case.ts:41
const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);

// reschedule-delivery.use-case.ts:25
const existing = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);
```
`existing` descreve "algo existe" — não diz o quê. Variável deve ser nomeada pelo conteúdo.

**Como deveria ser:**
```typescript
const existingCustomer  = await this.customerRepository.findByDocument(input.document);
const customerToUpdate  = await this.customerRepository.findById(input.id);
const existingScheduling = await this.schedulingRepository.findBySalesOrderId(input.salesOrderId);
```

---

### N10 — `created`/`updated` nomeados pela ação, não pelo conteúdo — padrão em todos os 6 repositórios

**Ponto de falha:**
```typescript
// sales-order.repository.ts:81
const created = await this.prisma.salesOrder.create({ ... });
return this.toDomain(created);

// customer.repository.ts:71, item.repository.ts:68, scheduling.repository.ts:28,
// transport-type.repository.ts:51, audit-log.repository.ts:13
const created = await this.prisma.[entidade].create({ ... });
const updated = await this.prisma.[entidade].update({ ... });
```
`created` e `updated` descrevem a operação executada. O nome deve descrever o que a variável contém.

**Como deveria ser:**
```typescript
const persistedOrder    = await this.prisma.salesOrder.create({ ... });
const updatedOrder      = await this.prisma.salesOrder.update({ ... });
const savedCustomer     = await this.prisma.customer.create({ ... });
```

---

### N11 — Fábrica de teste com prefixo `make` — não padronizado entre arquivos

**Ponto de falha:**
```typescript
// create-sales-order.use-case.spec.ts
const makeCustomer = (authorizedTransportTypeIds: string[]): CustomerEntity => ...
const makeItem     = (): ItemEntity => ...
const makeOrder    = (): SalesOrderEntity => ...

// sales-order.entity.spec.ts
const makeSalesOrder = (status: OrderStatus): SalesOrderEntity => ...
```
`make` não é convenção padrão. Cada arquivo define as factories de forma ligeiramente diferente (`makeOrder` vs `makeSalesOrder`).

**Como deveria ser:**
Escolher uma convenção e aplicar uniformemente:
```typescript
// Opção preferida: prefix build
const buildCustomer   = (...): CustomerEntity => ...
const buildSalesOrder = (...): SalesOrderEntity => ...
const buildItem       = (): ItemEntity => ...
```

---

### TS1 — `return` sem `await` em funções `async` — 3 use cases

**Ponto de falha:**
```typescript
// get-sales-orders.use-case.ts:14
async execute(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
  return this.salesOrderRepository.findAll(filters); // Promise retornada sem await
}

// get-customers.use-case.ts:12
async execute(): Promise<CustomerEntity[]> {
  return this.customerRepository.findAll();
}

// get-items.use-case.ts:10
async execute(): Promise<ItemEntity[]> {
  return this.itemRepository.findAll();
}
```
Regra do playbook TypeScript: dentro de funções `async`, sempre `return await promise`. Retornar a Promise diretamente faz a função sair do frame try/catch antes da rejeição — qualquer tratamento de erro adicionado ao redor nunca captura a falha.

**Como deveria ser:**
```typescript
async execute(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
  return await this.salesOrderRepository.findAll(filters);
}
```

---

### TS2 — `strict: true` ausente no `tsconfig.json`

**Ponto de falha:**
```json
{
  "strictNullChecks": true,
  "noImplicitAny": true,
  "strictBindCallApply": true
  // strict: true ausente
}
```
O playbook exige `"strict": true`. Com flags individuais, verificações novas adicionadas ao TypeScript (`useUnknownInCatchVariables`, `exactOptionalPropertyTypes`, etc.) não são habilitadas automaticamente. O projeto pode silenciosamente ficar sem novas proteções a cada versão do TS.

**Como deveria ser:**
```json
{
  "strict": true,
  "strictBindCallApply": false
}
```
`strictBindCallApply: false` é a única exceção justificada para compatibilidade com decorators NestJS.

---

### TS3 — Alias `@config/*` ausente — import relativo cruzando camadas

**Ponto de falha:**
```typescript
// app.module.ts:9
import { envValidationSchema } from '../../config/env.validation';
//                                   ↑ ../.. cruza de src/presentation/ para src/config/
```
`tsconfig.json` define `@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`, mas não `@config/*`. Resultado: o único arquivo de configuração do projeto é importado via caminho relativo cruzando fronteiras de camada.

**Como deveria ser:**
```json
// tsconfig.json
"paths": {
  "@domain/*":         ["src/domain/*"],
  "@application/*":    ["src/application/*"],
  "@infrastructure/*": ["src/infrastructure/*"],
  "@presentation/*":   ["src/presentation/*"],
  "@config/*":         ["src/config/*"]
}
```
```typescript
// app.module.ts
import { envValidationSchema } from '@config/env.validation';
```

---

## Positivos

O que está correto e seria aprovado pelo playbook:

- **Arquitetura hexagonal**: camadas `domain`, `application`, `infrastructure`, `presentation` claramente separadas. Use cases importam apenas tokens de porta — nenhuma dependência de infraestrutura concreta.
- **State machine no domínio**: `VALID_TRANSITIONS` na entidade. `transitionTo` lança `DomainException` para transições inválidas. Lógica de estado não vazou para o use case.
- **Porta de evento no domain**: `IEventEmitter` é uma interface no domain layer. `EventEmitter2` é injetado pela infraestrutura. O domain nunca importa `@nestjs/event-emitter`.
- **Validação de env no startup**: Joi schema em `env.validation.ts` — fail-fast se variáveis obrigatórias faltam antes de qualquer request.
- **TraceId propagado corretamente**: interceptor injeta e retorna `X-Trace-Id`. Filter inclui o traceId no payload de erro. Logs incluem `traceId` via `customProps`.
- **Structured logging**: `nestjs-pino` com níveis por status code, redação de `req`/`res`, `singleLine` em dev, `autoLogging` configurado.
- **`findByIds` no `IItemRepository`**: o N+1 de itens foi corretamente evitado em `create-sales-order.use-case.ts:49`. O mesmo padrão não foi aplicado para `TransportType`.
- **Testes unitários isolados**: `vi.fn()` por interface, `beforeEach` limpa mocks, testa caminhos de erro (customer not found, transport not authorized, item not found) e caminho feliz.
- **Teste de integração contra banco real**: não mocka o Prisma — valida comportamento real de persistência e limpeza de dados após o teste.
- **Observabilidade**: Prometheus + Grafana + Loki + Promtail configurados. Métricas de request count, duration e errors com labels `method`, `route`, `status_code`.

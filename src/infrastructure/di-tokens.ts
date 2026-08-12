/**
 * Tokens de injeção de dependência (DI) para o container do NestJS.
 *
 * Por que isso existe aqui e não no domínio:
 * - Interfaces TypeScript são apagadas na compilação (não existem em runtime).
 * - O Nest precisa de um valor real (Symbol) para resolver qual implementação
 *   injetar em cada construtor.
 * - Esse é um detalhe de "como resolvemos DI usando o Nest" — infraestrutura.
 *   O domínio não deve saber que esses Symbols existem.
 */

export const SALES_ORDER_REPOSITORY = Symbol('ISalesOrderRepository');
export const SCHEDULING_REPOSITORY = Symbol('ISchedulingRepository');
export const CUSTOMER_REPOSITORY = Symbol('ICustomerRepository');
export const ITEM_REPOSITORY = Symbol('IItemRepository');
export const TRANSPORT_TYPE_REPOSITORY = Symbol('ITransportTypeRepository');
export const AUDIT_LOG_REPOSITORY = Symbol('IAuditLogRepository');

export const UNIT_OF_WORK = Symbol('IUnitOfWork');
export const EVENT_EMITTER = Symbol('IEventEmitter');

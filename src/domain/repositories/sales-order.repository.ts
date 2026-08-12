import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { TransactionContext } from '@domain/ports/unit-of-work.port';
import type { PaginationParams } from '@domain/repositories/pagination';

export interface SalesOrderFilters extends PaginationParams {
  status?: OrderStatus;
  customerId?: string;
  transportTypeId?: string;
  itemId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ISalesOrderRepository {
  findById(id: string, transaction?: TransactionContext): Promise<SalesOrderEntity | undefined>;
  findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]>;
  create(salesOrder: SalesOrderEntity, transaction?: TransactionContext): Promise<SalesOrderEntity>;
  update(salesOrder: SalesOrderEntity, transaction?: TransactionContext): Promise<SalesOrderEntity>;
}

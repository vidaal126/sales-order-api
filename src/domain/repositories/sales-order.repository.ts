import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type { OrderStatus } from '@domain/enums/order-status.enum';
import type { PaginationParams } from '@domain/repositories/pagination';

export interface SalesOrderFilters extends PaginationParams {
  status?: OrderStatus;
  customerId?: string;
  transportTypeId?: string;
  itemId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export abstract class ISalesOrderRepository {
  abstract findById(id: string, tx?: unknown): Promise<SalesOrderEntity | undefined>;
  abstract findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]>;
  abstract create(salesOrder: SalesOrderEntity, tx?: unknown): Promise<SalesOrderEntity>;
  abstract update(salesOrder: SalesOrderEntity, tx?: unknown): Promise<SalesOrderEntity>;
}

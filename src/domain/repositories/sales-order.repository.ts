import { OrderStatus } from "@domain/enums/order-status.enum";
import { SalesOrderEntity } from "@domain/entities/sales-order.entity";

export interface SalesOrderFilters {
  status?: OrderStatus;
  customerId?: string;
  transportTypeId?: string;
  itemId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export abstract class ISalesOrderRepository {
  abstract findById(id: string): Promise<SalesOrderEntity | undefined>;
  abstract findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]>;
  abstract create(salesOrder: SalesOrderEntity): Promise<SalesOrderEntity>;
  abstract update(salesOrder: SalesOrderEntity): Promise<SalesOrderEntity>;
}

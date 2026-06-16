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

export interface ISalesOrderRepository {
  findById(id: string): Promise<SalesOrderEntity | undefined>;
  findAll(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]>;
  create(salesOrder: SalesOrderEntity): Promise<SalesOrderEntity>;
  update(salesOrder: SalesOrderEntity): Promise<SalesOrderEntity>;
}

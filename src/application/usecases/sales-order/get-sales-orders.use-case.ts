import { Injectable } from "@nestjs/common";
import type {
  ISalesOrderRepository,
  SalesOrderFilters,
} from "@domain/repositories/sales-order.repository";
import { SalesOrderEntity } from "@domain/entities/sales-order.entity";

@Injectable()
export class GetSalesOrdersUseCase {
  constructor(private readonly salesOrderRepository: ISalesOrderRepository) {}

  async execute(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
    return this.salesOrderRepository.findAll(filters);
  }
}

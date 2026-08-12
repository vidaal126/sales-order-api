import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import type {
  ISalesOrderRepository,
  SalesOrderFilters,
} from '@domain/repositories/sales-order.repository';
import { SALES_ORDER_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesOrdersUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY) private readonly salesOrderRepository: ISalesOrderRepository,
  ) {}

  async execute(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
    return this.salesOrderRepository.findAll(filters);
  }
}

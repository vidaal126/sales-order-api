import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import {
  ISalesOrderRepository,
  SalesOrderFilters,
} from '@domain/repositories/sales-order.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesOrdersUseCase {
  constructor(
    @Inject(ISalesOrderRepository) private readonly salesOrderRepository: ISalesOrderRepository,
  ) {}

  async execute(filters?: SalesOrderFilters): Promise<SalesOrderEntity[]> {
    return this.salesOrderRepository.findAll(filters);
  }
}

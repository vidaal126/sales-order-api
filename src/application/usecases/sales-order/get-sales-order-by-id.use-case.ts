import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { SALES_ORDER_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesOrderByIdUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: ISalesOrderRepository,
  ) {}

  async execute(id: string): Promise<SalesOrderEntity> {
    const order = await this.salesOrderRepository.findById(id);
    if (!order) {
      throw new DomainNotFoundException(`Ordem de venda ${id} não encontrada.`);
    }
    return order;
  }
}

import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesOrderByIdUseCase {
  constructor(
    @Inject(ISalesOrderRepository)
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

import type { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesOrderByIdUseCase {
  constructor(
    @Inject(ISalesOrderRepository) private readonly salesOrderRepository: ISalesOrderRepository,
  ) {}

  async execute(id: string): Promise<SalesOrderEntity> {
    const order = await this.salesOrderRepository.findById(id);
    if (!order) {
      throw new DomainException(`Ordem de venda ${id} não encontrada.`);
    }
    return order;
  }
}

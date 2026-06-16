import { Injectable } from "@nestjs/common";
import { ISalesOrderRepository } from "@domain/repositories/sales-order.repository";
import { SalesOrderEntity } from "@domain/entities/sales-order.entity";
import { DomainException } from "@domain/exceptions/domain.exception";

@Injectable()
export class GetSalesOrderByIdUseCase {
  constructor(private readonly salesOrderRepository: ISalesOrderRepository) {}

  async execute(id: string): Promise<SalesOrderEntity> {
    const order = await this.salesOrderRepository.findById(id);
    if (!order) {
      throw new DomainException(`Ordem de venda ${id} não encontrada.`);
    }
    return order;
  }
}

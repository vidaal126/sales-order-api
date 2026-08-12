import type { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(
    @Inject(ICustomerRepository) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new DomainNotFoundException(`Cliente ${id} não encontrado.`);
    }
    return customer;
  }
}

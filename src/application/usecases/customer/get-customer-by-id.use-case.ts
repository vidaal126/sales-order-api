import type { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new DomainNotFoundException(`Cliente ${id} não encontrado.`);
    }
    return customer;
  }
}

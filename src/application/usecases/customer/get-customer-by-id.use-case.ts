import type { CustomerEntity } from '@domain/entities/customer.entity';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { DomainNotFoundException } from '@infrastructure/http/exceptions/not-found.exception';
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

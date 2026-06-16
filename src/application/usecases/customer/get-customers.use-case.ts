import type { CustomerEntity } from '@domain/entities/customer.entity';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCustomersUseCase {
  constructor(
    @Inject(ICustomerRepository) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(): Promise<CustomerEntity[]> {
    return this.customerRepository.findAll();
  }
}

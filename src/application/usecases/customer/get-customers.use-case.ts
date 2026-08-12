import type { CustomerEntity } from '@domain/entities/customer.entity';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { PaginationParams } from '@domain/repositories/pagination';
import { CUSTOMER_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(params?: PaginationParams): Promise<CustomerEntity[]> {
    return this.customerRepository.findAll(params);
  }
}

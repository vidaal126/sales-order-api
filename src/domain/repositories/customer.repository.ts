import type { CustomerEntity } from '@domain/entities/customer.entity';
import type { PaginationParams } from '@domain/repositories/pagination';

export interface ICustomerRepository {
  findById(id: string, tx?: unknown): Promise<CustomerEntity | undefined>;
  findAll(params?: PaginationParams): Promise<CustomerEntity[]>;
  findByDocument(document: string): Promise<CustomerEntity | undefined>;
  create(customer: CustomerEntity): Promise<CustomerEntity>;
  update(customer: CustomerEntity): Promise<CustomerEntity>;
}

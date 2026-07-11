import type { CustomerEntity } from '@domain/entities/customer.entity';
import type { PaginationParams } from '@domain/repositories/pagination';

export abstract class ICustomerRepository {
  abstract findById(id: string): Promise<CustomerEntity | undefined>;
  abstract findAll(params?: PaginationParams): Promise<CustomerEntity[]>;
  abstract findByDocument(document: string): Promise<CustomerEntity | undefined>;
  abstract create(customer: CustomerEntity): Promise<CustomerEntity>;
  abstract update(customer: CustomerEntity): Promise<CustomerEntity>;
}

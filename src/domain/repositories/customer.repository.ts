import type { CustomerEntity } from '@domain/entities/customer.entity';

export abstract class ICustomerRepository {
  abstract findById(id: string): Promise<CustomerEntity | undefined>;
  abstract findAll(): Promise<CustomerEntity[]>;
  abstract findByDocument(document: string): Promise<CustomerEntity | undefined>;
  abstract create(customer: CustomerEntity): Promise<CustomerEntity>;
  abstract update(customer: CustomerEntity): Promise<CustomerEntity>;
}

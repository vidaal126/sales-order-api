import { CustomerEntity } from "@domain/entities/customer.entity";

export interface ICustomerRepository {
  findById(id: string): Promise<CustomerEntity | undefined>;
  findAll(): Promise<CustomerEntity[]>;
  findByDocument(document: string): Promise<CustomerEntity | undefined>;
  create(customer: CustomerEntity): Promise<CustomerEntity>;
  update(customer: CustomerEntity): Promise<CustomerEntity>;
}

import { CustomerEntity } from "@domain/entities/customer.entity";

export interface ICustomerRepository {
  findById(id: string): Promise<CustomerEntity | null>;
  findAll(): Promise<CustomerEntity[]>;
  findyByDocument(document: string): Promise<CustomerEntity | null>;
  create(customer: CustomerEntity): Promise<void>;
  update(customer: CustomerEntity): Promise<void>;
}

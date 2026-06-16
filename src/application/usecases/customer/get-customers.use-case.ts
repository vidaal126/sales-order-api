import { Injectable } from "@nestjs/common";
import { ICustomerRepository } from "@domain/repositories/customer.repository";
import { CustomerEntity } from "@domain/entities/customer.entity";

@Injectable()
export class GetCustomersUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(): Promise<CustomerEntity[]> {
    return this.customerRepository.findAll();
  }
}

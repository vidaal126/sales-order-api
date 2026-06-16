import { Injectable } from "@nestjs/common";
import { ICustomerRepository } from "@domain/repositories/customer.repository";
import { ITransportTypeRepository } from "@domain/repositories/transport-type.repository";
import { CustomerEntity } from "@domain/entities/customer.entity";
import { DomainException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";

export interface CreateCustomerInput {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  authorizedTransportTypeIds: string[];
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: CreateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.customerRepository.findByDocument(
      input.document,
    );
    if (existing) {
      throw new DomainException(
        `Cliente com documento ${input.document} já existe.`,
      );
    }

    for (const transportTypeId of input.authorizedTransportTypeIds) {
      const transportType =
        await this.transportTypeRepository.findById(transportTypeId);
      if (!transportType) {
        throw new DomainException(
          `Tipo de transporte ${transportTypeId} não encontrado.`,
        );
      }
    }

    const customer = new CustomerEntity({
      id: randomUUID(),
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorizedTransportTypeIds: input.authorizedTransportTypeIds,
    });

    return this.customerRepository.create(customer);
  }
}

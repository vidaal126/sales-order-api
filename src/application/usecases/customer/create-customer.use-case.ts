import { randomUUID } from 'node:crypto';
import { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { Inject, Injectable } from '@nestjs/common';

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
    @Inject(ICustomerRepository)
    private readonly customerRepository: ICustomerRepository,
    @Inject(ITransportTypeRepository)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: CreateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.customerRepository.findByDocument(input.document);
    if (existing) {
      throw new DomainException(`Cliente com documento ${input.document} já existe.`);
    }

    const foundTransportTypes = await this.transportTypeRepository.findByIds(
      input.authorizedTransportTypeIds,
    );
    if (foundTransportTypes.length !== input.authorizedTransportTypeIds.length) {
      const missing = input.authorizedTransportTypeIds.filter(
        (id): boolean =>
          !foundTransportTypes.some((transportType): boolean => transportType.id === id),
      );
      throw new DomainException(`Tipos de transporte não encontrados: ${missing.join(', ')}`);
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

import { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { Inject, Injectable } from '@nestjs/common';

export interface UpdateCustomerInput {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  authorizedTransportTypeIds?: string[];
}

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(ICustomerRepository)
    private readonly customerRepository: ICustomerRepository,
    @Inject(ITransportTypeRepository)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: UpdateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.customerRepository.findById(input.id);
    if (!existing) {
      throw new DomainException(`Cliente ${input.id} não encontrado.`);
    }

    if (input.authorizedTransportTypeIds) {
      for (const transportTypeId of input.authorizedTransportTypeIds) {
        const transportType = await this.transportTypeRepository.findById(transportTypeId);
        if (!transportType) {
          throw new DomainException(`Tipo de transporte ${transportTypeId} não encontrado.`);
        }
      }
    }

    const updated = new CustomerEntity({
      id: existing.id,
      name: input.name ?? existing.name,
      document: existing.document,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      authorizedTransportTypeIds:
        input.authorizedTransportTypeIds ?? existing.authorizedTransportTypeIds,
    });

    return this.customerRepository.update(updated);
  }
}

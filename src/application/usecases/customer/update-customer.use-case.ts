import { CustomerEntity } from '@domain/entities/customer.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { CUSTOMER_REPOSITORY, TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
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
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: UpdateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.customerRepository.findById(input.id);
    if (!existing) {
      throw new DomainException(`Cliente ${input.id} não encontrado.`);
    }

    if (input.authorizedTransportTypeIds) {
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

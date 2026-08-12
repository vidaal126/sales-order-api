import { randomUUID } from 'node:crypto';
import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface CreateTransportTypeInput {
  name: string;
  description?: string;
}

@Injectable()
export class CreateTransportTypeUseCase {
  constructor(
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: CreateTransportTypeInput): Promise<TransportTypeEntity> {
    const existing = await this.transportTypeRepository.findByName(input.name);
    if (existing) {
      throw new DomainException(`Tipo de transporte "${input.name}" já existe.`);
    }

    const transportType = new TransportTypeEntity({
      id: randomUUID(),
      name: input.name,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.transportTypeRepository.create(transportType);
  }
}

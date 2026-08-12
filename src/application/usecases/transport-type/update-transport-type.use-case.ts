import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { DomainException } from '@domain/exceptions/domain.exception';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

export interface UpdateTransportTypeInput {
  id: string;
  name?: string;
  description?: string;
}

@Injectable()
export class UpdateTransportTypeUseCase {
  constructor(
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: UpdateTransportTypeInput): Promise<TransportTypeEntity> {
    const existing = await this.transportTypeRepository.findById(input.id);
    if (!existing) {
      throw new DomainException(`Tipo de transporte ${input.id} não encontrado.`);
    }

    if (input.name && input.name !== existing.name) {
      const nameConflict = await this.transportTypeRepository.findByName(input.name);
      if (nameConflict) {
        throw new DomainException(`Tipo de transporte "${input.name}" já existe.`);
      }
    }

    const updated = new TransportTypeEntity({
      id: existing.id,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    return this.transportTypeRepository.update(updated);
  }
}

import { Injectable } from "@nestjs/common";
import { ITransportTypeRepository } from "@domain/repositories/transport-type.repository";
import { TransportTypeEntity } from "@domain/entities/transport-type.entity";
import { DomainException } from "@domain/exceptions/domain.exception";

export interface UpdateTransportTypeInput {
  id: string;
  name?: string;
  description?: string;
}

@Injectable()
export class UpdateTransportTypeUseCase {
  constructor(
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: UpdateTransportTypeInput): Promise<TransportTypeEntity> {
    const existing = await this.transportTypeRepository.findById(input.id);
    if (!existing) {
      throw new DomainException(
        `Tipo de transporte ${input.id} não encontrado.`,
      );
    }

    if (input.name && input.name !== existing.name) {
      const nameConflict = await this.transportTypeRepository.findByName(
        input.name,
      );
      if (nameConflict) {
        throw new DomainException(
          `Tipo de transporte "${input.name}" já existe.`,
        );
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

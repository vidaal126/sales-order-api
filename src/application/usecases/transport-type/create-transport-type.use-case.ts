import { Injectable } from "@nestjs/common";
import type { ITransportTypeRepository } from "@domain/repositories/transport-type.repository";
import { TransportTypeEntity } from "@domain/entities/transport-type.entity";
import { DomainException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";

export interface CreateTransportTypeInput {
  name: string;
  description?: string;
}

@Injectable()
export class CreateTransportTypeUseCase {
  constructor(
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(input: CreateTransportTypeInput): Promise<TransportTypeEntity> {
    const existing = await this.transportTypeRepository.findByName(input.name);
    if (existing) {
      throw new DomainException(
        `Tipo de transporte "${input.name}" já existe.`,
      );
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

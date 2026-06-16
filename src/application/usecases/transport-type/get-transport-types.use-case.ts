import { Injectable } from "@nestjs/common";
import type { ITransportTypeRepository } from "@domain/repositories/transport-type.repository";
import { TransportTypeEntity } from "@domain/entities/transport-type.entity";

@Injectable()
export class GetTransportTypesUseCase {
  constructor(private readonly transportTypeRepository: ITransportTypeRepository) {}

  async execute(): Promise<TransportTypeEntity[]> {
    return this.transportTypeRepository.findAll();
  }
}

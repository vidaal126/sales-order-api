import type { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetTransportTypesUseCase {
  constructor(
    @Inject(ITransportTypeRepository)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(): Promise<TransportTypeEntity[]> {
    return this.transportTypeRepository.findAll();
  }
}

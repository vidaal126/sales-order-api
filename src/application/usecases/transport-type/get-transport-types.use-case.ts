import type { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import type { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetTransportTypesUseCase {
  constructor(
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async execute(): Promise<TransportTypeEntity[]> {
    return this.transportTypeRepository.findAll();
  }
}

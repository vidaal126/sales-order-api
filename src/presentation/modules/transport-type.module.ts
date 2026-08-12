import { CreateTransportTypeUseCase } from '@application/usecases/transport-type/create-transport-type.use-case';
import { GetTransportTypesUseCase } from '@application/usecases/transport-type/get-transport-types.use-case';
import { UpdateTransportTypeUseCase } from '@application/usecases/transport-type/update-transport-type.use-case';
import { TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
import { TransportTypeRepository } from '@infrastructure/repositories/transport-type.repository';
import { Module } from '@nestjs/common';
import { TransportTypesController } from '@presentation/controllers/v1/transport-types.controller';

@Module({
  controllers: [TransportTypesController],
  providers: [
    { provide: TRANSPORT_TYPE_REPOSITORY, useClass: TransportTypeRepository },
    CreateTransportTypeUseCase,
    UpdateTransportTypeUseCase,
    GetTransportTypesUseCase,
  ],
  exports: [TRANSPORT_TYPE_REPOSITORY],
})
export class TransportTypeModule {}

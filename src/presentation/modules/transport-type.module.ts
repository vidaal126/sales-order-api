import { CreateTransportTypeUseCase } from '@application/usecases/transport-type/create-transport-type.use-case';
import { GetTransportTypesUseCase } from '@application/usecases/transport-type/get-transport-types.use-case';
import { UpdateTransportTypeUseCase } from '@application/usecases/transport-type/update-transport-type.use-case';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { TransportTypeRepository } from '@infrastructure/repositories/transport-type.repository';
import { Module } from '@nestjs/common';
import { TransportTypesController } from '@presentation/controllers/v1/transport-types.controller';

@Module({
  controllers: [TransportTypesController],
  providers: [
    { provide: ITransportTypeRepository, useClass: TransportTypeRepository },
    CreateTransportTypeUseCase,
    UpdateTransportTypeUseCase,
    GetTransportTypesUseCase,
  ],
  exports: [ITransportTypeRepository],
})
export class TransportTypeModule {}

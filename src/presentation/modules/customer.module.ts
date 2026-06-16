import { Module } from '@nestjs/common';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { CustomerRepository } from '@infrastructure/repositories/customer.repository';
import { TransportTypeRepository } from '@infrastructure/repositories/transport-type.repository';
import { CreateCustomerUseCase } from '@application/usecases/customer/create-customer.use-case';
import { UpdateCustomerUseCase } from '@application/usecases/customer/update-customer.use-case';
import { GetCustomersUseCase } from '@application/usecases/customer/get-customers.use-case';
import { CustomersController } from '@presentation/controllers/v1/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    { provide: ICustomerRepository, useClass: CustomerRepository },
    { provide: ITransportTypeRepository, useClass: TransportTypeRepository },
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    GetCustomersUseCase,
  ],
  exports: [ICustomerRepository],
})
export class CustomerModule {}

import { CreateCustomerUseCase } from '@application/usecases/customer/create-customer.use-case';
import { GetCustomerByIdUseCase } from '@application/usecases/customer/get-customer-by-id.use-case';
import { GetCustomersUseCase } from '@application/usecases/customer/get-customers.use-case';
import { UpdateCustomerUseCase } from '@application/usecases/customer/update-customer.use-case';
import { CUSTOMER_REPOSITORY, TRANSPORT_TYPE_REPOSITORY } from '@infrastructure/di-tokens';
import { CustomerRepository } from '@infrastructure/repositories/customer.repository';
import { TransportTypeRepository } from '@infrastructure/repositories/transport-type.repository';
import { Module } from '@nestjs/common';
import { CustomersController } from '@presentation/controllers/v1/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerRepository },
    { provide: TRANSPORT_TYPE_REPOSITORY, useClass: TransportTypeRepository },
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    GetCustomersUseCase,
    GetCustomerByIdUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomerModule {}

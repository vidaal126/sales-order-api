import { ChangeSalesOrderTransportUseCase } from '@application/usecases/sales-order/change-sales-order-transport.use-case';
import { CreateSalesOrderUseCase } from '@application/usecases/sales-order/create-sales-order.use-case';
import { GetSalesOrderByIdUseCase } from '@application/usecases/sales-order/get-sales-order-by-id.use-case';
import { GetSalesOrdersUseCase } from '@application/usecases/sales-order/get-sales-orders.use-case';
import { RescheduleDeliveryUseCase } from '@application/usecases/sales-order/reschedule-delivery.use-case';
import { ScheduleDeliveryUseCase } from '@application/usecases/sales-order/schedule-delivery.use-case';
import { UpdateSalesOrderStatusUseCase } from '@application/usecases/sales-order/update-sales-order-status.use-case';
import { IAuditLogRepository } from '@domain/repositories/audit-log.repository';
import { ICustomerRepository } from '@domain/repositories/customer.repository';
import { IItemRepository } from '@domain/repositories/item.repository';
import {
  EVENT_EMITTER,
  SALES_ORDER_REPOSITORY,
  SCHEDULING_REPOSITORY,
} from '@infrastructure/di-tokens';
import { AuditLogRepository } from '@infrastructure/repositories/audit-log.repository';
import { CustomerRepository } from '@infrastructure/repositories/customer.repository';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { SalesOrderRepository } from '@infrastructure/repositories/sales-order.repository';
import { SchedulingRepository } from '@infrastructure/repositories/scheduling.repository';
import { AuditListener } from '@infrastructure/services/audit.listener';
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { SalesOrdersController } from '@presentation/controllers/v1/sales-orders.controller';

@Module({
  imports: [EventEmitterModule],
  controllers: [SalesOrdersController],
  providers: [
    { provide: SALES_ORDER_REPOSITORY, useClass: SalesOrderRepository },
    { provide: ICustomerRepository, useClass: CustomerRepository },
    { provide: IItemRepository, useClass: ItemRepository },
    { provide: SCHEDULING_REPOSITORY, useClass: SchedulingRepository },
    { provide: IAuditLogRepository, useClass: AuditLogRepository },
    { provide: EVENT_EMITTER, useExisting: EventEmitter2 },
    AuditListener,
    CreateSalesOrderUseCase,
    UpdateSalesOrderStatusUseCase,
    GetSalesOrdersUseCase,
    GetSalesOrderByIdUseCase,
    ScheduleDeliveryUseCase,
    RescheduleDeliveryUseCase,
    ChangeSalesOrderTransportUseCase,
  ],
})
export class SalesOrderModule {}

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesOrderRepository } from '@infrastructure/repositories/sales-order.repository';
import { CustomerRepository } from '@infrastructure/repositories/customer.repository';
import { ItemRepository } from '@infrastructure/repositories/item.repository';
import { SchedulingRepository } from '@infrastructure/repositories/scheduling.repository';
import { AuditLogRepository } from '@infrastructure/repositories/audit-log.repository';
import { AuditListener } from '@infrastructure/services/audit.listener';
import { CreateSalesOrderUseCase } from '@application/usecases/sales-order/create-sales-order.use-case';
import { UpdateSalesOrderStatusUseCase } from '@application/usecases/sales-order/update-sales-order-status.use-case';
import { GetSalesOrdersUseCase } from '@application/usecases/sales-order/get-sales-orders.use-case';
import { GetSalesOrderByIdUseCase } from '@application/usecases/sales-order/get-sales-order-by-id.use-case';
import { ScheduleDeliveryUseCase } from '@application/usecases/sales-order/schedule-delivery.use-case';
import { RescheduleDeliveryUseCase } from '@application/usecases/sales-order/reschedule-delivery.use-case';
import { SalesOrdersController } from '@presentation/controllers/v1/sales-orders.controller';
import { EVENT_EMITTER_PORT } from '@domain/events/event-emitter.port';

@Module({
  imports: [EventEmitterModule],
  controllers: [SalesOrdersController],
  providers: [
    SalesOrderRepository, CustomerRepository, ItemRepository,
    SchedulingRepository, AuditLogRepository, AuditListener,
    CreateSalesOrderUseCase, UpdateSalesOrderStatusUseCase,
    GetSalesOrdersUseCase, GetSalesOrderByIdUseCase,
    ScheduleDeliveryUseCase, RescheduleDeliveryUseCase,
    { provide: EVENT_EMITTER_PORT, useExisting: EventEmitter2 },
  ],
})
export class SalesOrderModule {}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditAction } from '@domain/enums/audit-action.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class AuditListener {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: { orderId: string; customerId: string; status: string }): Promise<void> {
    await this.auditLogRepository.create(new AuditLogEntity({
      id: randomUUID(), action: AuditAction.ORDER_CREATED, entityType: 'SalesOrder',
      entityId: event.orderId, currentState: { status: event.status, customerId: event.customerId },
      createdAt: new Date(), salesOrderId: event.orderId,
    }));
  }

  @OnEvent('order.status.changed')
  async handleStatusChanged(event: { orderId: string; previousStatus: string; currentStatus: string }): Promise<void> {
    await this.auditLogRepository.create(new AuditLogEntity({
      id: randomUUID(), action: AuditAction.ORDER_STATUS_CHANGED, entityType: 'SalesOrder',
      entityId: event.orderId, previousState: { status: event.previousStatus },
      currentState: { status: event.currentStatus }, createdAt: new Date(), salesOrderId: event.orderId,
    }));
  }

  @OnEvent('order.delivery.scheduled')
  async handleDeliveryScheduled(event: { orderId: string; schedulingId: string; deliveryDate: Date }): Promise<void> {
    await this.auditLogRepository.create(new AuditLogEntity({
      id: randomUUID(), action: AuditAction.DELIVERY_SCHEDULED, entityType: 'SalesOrder',
      entityId: event.orderId, currentState: { schedulingId: event.schedulingId, deliveryDate: event.deliveryDate },
      createdAt: new Date(), salesOrderId: event.orderId,
    }));
  }

  @OnEvent('order.delivery.rescheduled')
  async handleDeliveryRescheduled(event: { orderId: string; previousDate: Date; newDate: Date }): Promise<void> {
    await this.auditLogRepository.create(new AuditLogEntity({
      id: randomUUID(), action: AuditAction.DELIVERY_RESCHEDULED, entityType: 'SalesOrder',
      entityId: event.orderId, previousState: { deliveryDate: event.previousDate },
      currentState: { deliveryDate: event.newDate }, createdAt: new Date(), salesOrderId: event.orderId,
    }));
  }
}

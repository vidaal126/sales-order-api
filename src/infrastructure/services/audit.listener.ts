import { randomUUID } from 'node:crypto';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditAction } from '@domain/enums/audit-action.enum';
import type { IAuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuditListener {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogRepository: IAuditLogRepository,
    @InjectPinoLogger(AuditListener.name)
    private readonly logger: PinoLogger,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: {
    orderId: string;
    customerId: string;
    status: string;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create(
        new AuditLogEntity({
          id: randomUUID(),
          action: AuditAction.ORDER_CREATED,
          entityType: 'SalesOrder',
          entityId: event.orderId,
          currentState: { status: event.status, customerId: event.customerId },
          createdAt: new Date(),
          salesOrderId: event.orderId,
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        { err, orderId: event.orderId },
        'Failed to persist audit log for order.created',
      );
    }
  }

  @OnEvent('order.status.changed')
  async handleStatusChanged(event: {
    orderId: string;
    previousStatus: string;
    currentStatus: string;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create(
        new AuditLogEntity({
          id: randomUUID(),
          action: AuditAction.ORDER_STATUS_CHANGED,
          entityType: 'SalesOrder',
          entityId: event.orderId,
          previousState: { status: event.previousStatus },
          currentState: { status: event.currentStatus },
          createdAt: new Date(),
          salesOrderId: event.orderId,
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        { err, orderId: event.orderId },
        'Failed to persist audit log for order.status.changed',
      );
    }
  }

  @OnEvent('order.delivery.scheduled')
  async handleDeliveryScheduled(event: {
    orderId: string;
    schedulingId: string;
    deliveryDate: Date;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create(
        new AuditLogEntity({
          id: randomUUID(),
          action: AuditAction.DELIVERY_SCHEDULED,
          entityType: 'SalesOrder',
          entityId: event.orderId,
          currentState: { schedulingId: event.schedulingId, deliveryDate: event.deliveryDate },
          createdAt: new Date(),
          salesOrderId: event.orderId,
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        { err, orderId: event.orderId },
        'Failed to persist audit log for order.delivery.scheduled',
      );
    }
  }

  @OnEvent('order.delivery.rescheduled')
  async handleDeliveryRescheduled(event: {
    orderId: string;
    previousDate: Date;
    newDate: Date;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create(
        new AuditLogEntity({
          id: randomUUID(),
          action: AuditAction.DELIVERY_RESCHEDULED,
          entityType: 'SalesOrder',
          entityId: event.orderId,
          previousState: { deliveryDate: event.previousDate },
          currentState: { deliveryDate: event.newDate },
          createdAt: new Date(),
          salesOrderId: event.orderId,
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        { err, orderId: event.orderId },
        'Failed to persist audit log for order.delivery.rescheduled',
      );
    }
  }

  @OnEvent('order.transport.changed')
  async handleTransportChanged(event: {
    orderId: string;
    previousTransportTypeId: string;
    currentTransportTypeId: string;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create(
        new AuditLogEntity({
          id: randomUUID(),
          action: AuditAction.TRANSPORT_CHANGED,
          entityType: 'SalesOrder',
          entityId: event.orderId,
          previousState: { transportTypeId: event.previousTransportTypeId },
          currentState: { transportTypeId: event.currentTransportTypeId },
          createdAt: new Date(),
          salesOrderId: event.orderId,
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        { err, orderId: event.orderId },
        'Failed to persist audit log for order.transport.changed',
      );
    }
  }
}

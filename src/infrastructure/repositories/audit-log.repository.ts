import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { IAuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditAction } from '@domain/enums/audit-action.enum';

@Injectable()
export class AuditLogRepository extends IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) { super(); }

  async create(auditLog: AuditLogEntity): Promise<AuditLogEntity> {
    const created = await this.prisma.auditLog.create({
      data: {
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        previousState: auditLog.previousState ?? undefined,
        currentState: auditLog.currentState ?? undefined,
        metadata: auditLog.metadata ?? undefined,
        salesOrderId: auditLog.salesOrderId,
      },
    });
    return new AuditLogEntity({
      id: created.id,
      action: created.action as AuditAction,
      entityType: created.entityType,
      entityId: created.entityId,
      previousState: created.previousState ?? undefined,
      currentState: created.currentState ?? undefined,
      metadata: created.metadata ?? undefined,
      createdAt: created.createdAt,
      salesOrderId: created.salesOrderId ?? undefined,
    });
  }

  async findBySalesOrderId(salesOrderId: string): Promise<AuditLogEntity[]> {
    const logs = await this.prisma.auditLog.findMany({ where: { salesOrderId }, orderBy: { createdAt: 'asc' } });
    return logs.map((log): AuditLogEntity => new AuditLogEntity({
      id: log.id,
      action: log.action as AuditAction,
      entityType: log.entityType,
      entityId: log.entityId,
      previousState: log.previousState ?? undefined,
      currentState: log.currentState ?? undefined,
      metadata: log.metadata ?? undefined,
      createdAt: log.createdAt,
      salesOrderId: log.salesOrderId ?? undefined,
    }));
  }
}

import type { AuditLogEntity } from '@domain/entities/audit-log.entity';

export interface IAuditLogRepository {
  create(auditLog: AuditLogEntity): Promise<AuditLogEntity>;
  findBySalesOrderId(salesOrderId: string): Promise<AuditLogEntity[]>;
}

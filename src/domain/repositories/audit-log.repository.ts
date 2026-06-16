import { AuditLogEntity } from '@domain/entities/audit-log.entity';

export abstract class IAuditLogRepository {
  abstract create(auditLog: AuditLogEntity): Promise<AuditLogEntity>;
  abstract findBySalesOrderId(salesOrderId: string): Promise<AuditLogEntity[]>;
}

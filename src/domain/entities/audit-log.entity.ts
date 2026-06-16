import { AuditAction } from '../enums/audit-action.enum';

export class AuditLogEntity {
  readonly id: string;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string;
  readonly previousState?: unknown;
  readonly currentState?: unknown;
  readonly metadata?: unknown;
  readonly createdAt: Date;
  readonly salesOrderId?: string;

  constructor(props: {
    id: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    previousState?: unknown;
    currentState?: unknown;
    metadata?: unknown;
    createdAt: Date;
    salesOrderId?: string;
  }) {
    this.id = props.id;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.previousState = props.previousState;
    this.currentState = props.currentState;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.salesOrderId = props.salesOrderId;
  }
}

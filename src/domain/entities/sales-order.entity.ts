import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '../exceptions/domain.exception';
import { BaseEntity } from './base.entity';
import type { SalesOrderItemEntity } from './sales-order-item.entity';
import type { SchedulingEntity } from './scheduling.entity';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CRIADA]: [OrderStatus.PLANEJADA],
  [OrderStatus.PLANEJADA]: [OrderStatus.AGENDADA],
  [OrderStatus.AGENDADA]: [OrderStatus.EM_TRANSPORTE],
  [OrderStatus.EM_TRANSPORTE]: [OrderStatus.ENTREGUE],
  [OrderStatus.ENTREGUE]: [],
};

export class SalesOrderEntity extends BaseEntity {
  readonly customerId: string;
  readonly notes?: string;
  readonly updatedAt: Date;
  readonly items: SalesOrderItemEntity[];
  readonly scheduling?: SchedulingEntity;

  private _status: OrderStatus;
  private _transportTypeId: string;

  constructor(props: {
    id: string;
    customerId: string;
    transportTypeId: string;
    status: OrderStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    items: SalesOrderItemEntity[];
    scheduling?: SchedulingEntity;
  }) {
    super(props.id, props.createdAt);

    if (props.items.length === 0) {
      throw new DomainException('Ordem de venda deve conter ao menos um item.');
    }

    this.customerId = props.customerId;
    this._transportTypeId = props.transportTypeId;
    this._status = props.status;
    this.notes = props.notes;
    this.updatedAt = props.updatedAt;
    this.items = props.items;
    this.scheduling = props.scheduling;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get transportTypeId(): string {
    return this._transportTypeId;
  }

  changeTransportTo(newTransportTypeId: string): void {
    this._transportTypeId = newTransportTypeId;
  }

  transitionTo(newStatus: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new DomainException(
        `Transição inválida: ${this._status} → ${newStatus}. ` +
          `Transições permitidas: ${allowed.join(', ') || 'nenhuma'}`,
      );
    }
    this._status = newStatus;
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    return VALID_TRANSITIONS[this._status].includes(newStatus);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      customerId: this.customerId,
      transportTypeId: this.transportTypeId,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this.items,
      scheduling: this.scheduling,
    };
  }
}

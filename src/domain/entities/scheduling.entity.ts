import { BaseEntity } from './base.entity';

export class SchedulingEntity extends BaseEntity {
  readonly salesOrderId: string;
  readonly deliveryDate: Date;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly confirmedAt?: Date;
  readonly rescheduledAt?: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    salesOrderId: string;
    deliveryDate: Date;
    windowStart: Date;
    windowEnd: Date;
    confirmedAt?: Date;
    rescheduledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt);
    this.salesOrderId = props.salesOrderId;
    this.deliveryDate = props.deliveryDate;
    this.windowStart = props.windowStart;
    this.windowEnd = props.windowEnd;
    this.confirmedAt = props.confirmedAt;
    this.rescheduledAt = props.rescheduledAt;
    this.updatedAt = props.updatedAt;
  }

  isConfirmed(): boolean {
    return !!this.confirmedAt;
  }

  isRescheduled(): boolean {
    return !!this.rescheduledAt;
  }
}

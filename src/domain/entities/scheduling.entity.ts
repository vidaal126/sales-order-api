import { DomainException } from '../exceptions/domain.exception';
import { BaseEntity } from './base.entity';

export class SchedulingEntity extends BaseEntity {
  static readonly MAX_SCHEDULING_HORIZON_DAYS = 365;

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

  /**
   * Valida as invariantes de uma janela de entrega no momento do agendamento
   * ou reagendamento:
   * - início anterior ao fim;
   * - janela não pode começar no passado;
   * - data de entrega dentro do horizonte máximo permitido;
   * - janela precisa ocorrer no mesmo dia (UTC) da data de entrega.
   */
  static validateWindow(input: {
    deliveryDate: Date;
    windowStart: Date;
    windowEnd: Date;
    now?: Date;
  }): void {
    const now = input.now ?? new Date();

    if (input.windowStart >= input.windowEnd) {
      throw new DomainException('Janela de atendimento inválida: início deve ser anterior ao fim.');
    }

    if (input.windowStart < now) {
      throw new DomainException('Não é possível agendar uma entrega em data/hora passada.');
    }

    const maxDate = new Date(
      now.getTime() + SchedulingEntity.MAX_SCHEDULING_HORIZON_DAYS * 24 * 60 * 60 * 1000,
    );
    if (input.deliveryDate > maxDate) {
      throw new DomainException(
        `Data de entrega excede o horizonte máximo de ${SchedulingEntity.MAX_SCHEDULING_HORIZON_DAYS} dias.`,
      );
    }

    const toUtcDay = (date: Date): string => date.toISOString().slice(0, 10);
    const deliveryDay = toUtcDay(input.deliveryDate);
    if (toUtcDay(input.windowStart) !== deliveryDay || toUtcDay(input.windowEnd) !== deliveryDay) {
      throw new DomainException(
        'A janela de atendimento deve ocorrer no mesmo dia (UTC) da data de entrega.',
      );
    }
  }
}

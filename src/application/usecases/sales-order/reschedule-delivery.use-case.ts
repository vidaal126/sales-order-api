import { Inject, Injectable } from "@nestjs/common";
import type { ISchedulingRepository } from "@domain/repositories/scheduling.repository";
import type { IEventEmitter } from "@domain/events/event-emitter.port";
import { EVENT_EMITTER_PORT } from "@domain/events/event-emitter.port";
import { SchedulingEntity } from "@domain/entities/scheduling.entity";
import { DomainException } from "@domain/exceptions/domain.exception";

export interface RescheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class RescheduleDeliveryUseCase {
  constructor(
    private readonly schedulingRepository: ISchedulingRepository,
    @Inject(EVENT_EMITTER_PORT)
    private readonly eventEmitter: IEventEmitter,
  ) {}

  async execute(input: RescheduleDeliveryInput): Promise<SchedulingEntity> {
    const existing = await this.schedulingRepository.findBySalesOrderId(
      input.salesOrderId,
    );
    if (!existing) {
      throw new DomainException(
        `Agendamento para ordem ${input.salesOrderId} não encontrado.`,
      );
    }

    if (input.windowStart >= input.windowEnd) {
      throw new DomainException(
        `Janela de atendimento inválida: início deve ser anterior ao fim.`,
      );
    }

    const previousDate = existing.deliveryDate;

    const updated = new SchedulingEntity({
      id: existing.id,
      salesOrderId: existing.salesOrderId,
      deliveryDate: input.deliveryDate,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      confirmedAt: existing.confirmedAt,
      rescheduledAt: new Date(),
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.schedulingRepository.update(updated);

    this.eventEmitter.emit("order.delivery.rescheduled", {
      orderId: input.salesOrderId,
      previousDate,
      newDate: saved.deliveryDate,
    });

    return saved;
  }
}

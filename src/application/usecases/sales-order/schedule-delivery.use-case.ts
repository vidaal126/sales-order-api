import { Inject, Injectable } from "@nestjs/common";
import type { ISalesOrderRepository } from "@domain/repositories/sales-order.repository";
import type { ISchedulingRepository } from "@domain/repositories/scheduling.repository";
import type { IEventEmitter } from "@domain/events/event-emitter.port";
import { EVENT_EMITTER_PORT } from "@domain/events/event-emitter.port";
import { SchedulingEntity } from "@domain/entities/scheduling.entity";
import { OrderStatus } from "@domain/enums/order-status.enum";
import { DomainException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";

export interface ScheduleDeliveryInput {
  salesOrderId: string;
  deliveryDate: Date;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class ScheduleDeliveryUseCase {
  constructor(
    private readonly salesOrderRepository: ISalesOrderRepository,
    private readonly schedulingRepository: ISchedulingRepository,
    @Inject(EVENT_EMITTER_PORT)
    private readonly eventEmitter: IEventEmitter,
  ) {}

  async execute(input: ScheduleDeliveryInput): Promise<SchedulingEntity> {
    const order = await this.salesOrderRepository.findById(input.salesOrderId);
    if (!order) {
      throw new DomainException(
        `Ordem de venda ${input.salesOrderId} não encontrada.`,
      );
    }

    if (!order.canTransitionTo(OrderStatus.AGENDADA)) {
      throw new DomainException(
        `Ordem de venda não pode ser agendada no status atual: ${order.status}.`,
      );
    }

    const existing = await this.schedulingRepository.findBySalesOrderId(
      input.salesOrderId,
    );
    if (existing) {
      throw new DomainException(
        `Ordem de venda ${input.salesOrderId} já possui agendamento.`,
      );
    }

    if (input.windowStart >= input.windowEnd) {
      throw new DomainException(
        `Janela de atendimento inválida: início deve ser anterior ao fim.`,
      );
    }

    const scheduling = new SchedulingEntity({
      id: randomUUID(),
      salesOrderId: input.salesOrderId,
      deliveryDate: input.deliveryDate,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await this.schedulingRepository.create(scheduling);

    order.transitionTo(OrderStatus.AGENDADA);
    await this.salesOrderRepository.update(order);

    this.eventEmitter.emit("order.delivery.scheduled", {
      orderId: order.id,
      schedulingId: created.id,
      deliveryDate: created.deliveryDate,
    });

    return created;
  }
}

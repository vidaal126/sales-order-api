import { SalesOrderEntity } from '@domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@domain/entities/sales-order-item.entity';
import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '@domain/exceptions/domain.exception';
import { DomainNotFoundException } from '@domain/exceptions/domain-not-found.exception';
import type { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { ISalesOrderRepository } from '@domain/repositories/sales-order.repository';
import type { ISchedulingRepository } from '@domain/repositories/scheduling.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RescheduleDeliveryUseCase } from './reschedule-delivery.use-case';

const mockSalesOrderRepository: ISalesOrderRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockSchedulingRepository: ISchedulingRepository = {
  findBySalesOrderId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockOutboxRepository: IOutboxRepository = {
  enqueue: vi.fn(),
  findUnpublished: vi.fn(),
  markPublished: vi.fn(),
};

const mockUnitOfWork: IUnitOfWork = {
  execute: <T>(work: (tx: unknown) => Promise<T>): Promise<T> => work({}),
};

const makeOrder = (status: OrderStatus): SalesOrderEntity =>
  new SalesOrderEntity({
    id: 'order-id',
    customerId: 'customer-id',
    transportTypeId: 'transport-id',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [new SalesOrderItemEntity({ itemId: 'item-id', quantity: 1, unitPrice: 10 })],
  });

const makeScheduling = (deliveryDate: Date): SchedulingEntity =>
  new SchedulingEntity({
    id: 'scheduling-id',
    salesOrderId: 'order-id',
    deliveryDate,
    windowStart: deliveryDate,
    windowEnd: new Date(deliveryDate.getTime() + 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

/** Builds a window fully contained within a single future UTC day, `daysFromNow` days out. */
const sameDayWindow = (
  daysFromNow: number,
): { deliveryDate: Date; windowStart: Date; windowEnd: Date } => {
  const base = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const day = base.toISOString().slice(0, 10);
  return {
    deliveryDate: new Date(`${day}T10:00:00.000Z`),
    windowStart: new Date(`${day}T08:00:00.000Z`),
    windowEnd: new Date(`${day}T12:00:00.000Z`),
  };
};

describe('RescheduleDeliveryUseCase', (): void => {
  let useCase: RescheduleDeliveryUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new RescheduleDeliveryUseCase(
      mockSalesOrderRepository,
      mockSchedulingRepository,
      mockOutboxRepository,
      mockUnitOfWork,
    );
  });

  it('should throw DomainNotFoundException when the sales order does not exist', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(undefined);

    await expect(useCase.execute({ salesOrderId: 'missing', ...sameDayWindow(2) })).rejects.toThrow(
      DomainNotFoundException,
    );
  });

  it('should throw DomainException when the order is not in AGENDADA status (e.g. already ENTREGUE)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.ENTREGUE));

    await expect(
      useCase.execute({ salesOrderId: 'order-id', ...sameDayWindow(2) }),
    ).rejects.toThrow(DomainException);
    expect(mockSchedulingRepository.update).not.toHaveBeenCalled();
  });

  it('should throw DomainException when the order is still CRIADA (never scheduled)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.CRIADA));

    await expect(
      useCase.execute({ salesOrderId: 'order-id', ...sameDayWindow(2) }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainNotFoundException when the order is AGENDADA but no scheduling record exists', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.AGENDADA));
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);

    await expect(
      useCase.execute({ salesOrderId: 'order-id', ...sameDayWindow(2) }),
    ).rejects.toThrow(DomainNotFoundException);
  });

  it('should throw DomainException for a new delivery date far in the past (year 1900)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.AGENDADA));
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(
      makeScheduling(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    );

    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: new Date('1900-01-01T00:00:00Z'),
        windowStart: new Date('1900-01-01T08:00:00Z'),
        windowEnd: new Date('1900-01-01T12:00:00Z'),
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException for a new delivery date beyond the max horizon (year 9999)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.AGENDADA));
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(
      makeScheduling(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    );

    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: new Date('9999-12-31T00:00:00Z'),
        windowStart: new Date('9999-12-31T08:00:00Z'),
        windowEnd: new Date('9999-12-31T12:00:00Z'),
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should reschedule successfully and emit the event with previous and new dates', async (): Promise<void> => {
    const previousDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const existingScheduling = makeScheduling(previousDate);
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.AGENDADA));
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(existingScheduling);
    vi.mocked(mockSchedulingRepository.update).mockImplementation(
      (scheduling): Promise<SchedulingEntity> => Promise.resolve(scheduling),
    );

    const window = sameDayWindow(5);
    const result = await useCase.execute({ salesOrderId: 'order-id', ...window });

    expect(result.deliveryDate).toEqual(window.deliveryDate);
    expect(mockOutboxRepository.enqueue).toHaveBeenCalledWith(
      'order.delivery.rescheduled',
      {
        orderId: 'order-id',
        previousDate: existingScheduling.deliveryDate,
        newDate: window.deliveryDate,
      },
      expect.anything(),
    );
  });
});

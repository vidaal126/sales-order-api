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
import { ScheduleDeliveryUseCase } from './schedule-delivery.use-case';

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

const future = (hoursFromNow: number): Date => new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

/** Builds a window fully contained within a single future UTC day, `daysFromNow` days out. */
const sameDayWindow = (
  daysFromNow: number,
): { deliveryDate: Date; windowStart: Date; windowEnd: Date } => {
  const base = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const day = base.toISOString().slice(0, 10);
  return {
    deliveryDate: new Date(`${day}T10:00:00.000Z`),
    windowStart:
      new Date(`${day}T08:00:00.000Z`) < new Date()
        ? new Date(`${day}T10:00:00.000Z`)
        : new Date(`${day}T08:00:00.000Z`),
    windowEnd: new Date(`${day}T12:00:00.000Z`),
  };
};

describe('ScheduleDeliveryUseCase', (): void => {
  let useCase: ScheduleDeliveryUseCase;

  beforeEach((): void => {
    vi.clearAllMocks();
    useCase = new ScheduleDeliveryUseCase(
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

  it('should throw DomainException when the order status does not allow scheduling', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(makeOrder(OrderStatus.CRIADA));

    await expect(
      useCase.execute({ salesOrderId: 'order-id', ...sameDayWindow(2) }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when a scheduling already exists for the order', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.PLANEJADA),
    );
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(
      new SchedulingEntity({
        id: 'scheduling-id',
        salesOrderId: 'order-id',
        deliveryDate: future(24),
        windowStart: future(24),
        windowEnd: future(25),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ salesOrderId: 'order-id', ...sameDayWindow(3) }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when windowStart is in the past', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.PLANEJADA),
    );
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: new Date('2020-01-01T00:00:00Z'),
        windowStart: new Date('2020-01-01T08:00:00Z'),
        windowEnd: new Date('2020-01-01T12:00:00Z'),
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException for a delivery date very far in the past (year 1900)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.PLANEJADA),
    );
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: new Date('1900-01-01T00:00:00Z'),
        windowStart: new Date('1900-01-01T08:00:00Z'),
        windowEnd: new Date('1900-01-01T12:00:00Z'),
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException for a delivery date far beyond the max horizon (year 9999)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.PLANEJADA),
    );
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: new Date('9999-12-31T00:00:00Z'),
        windowStart: new Date('9999-12-31T08:00:00Z'),
        windowEnd: new Date('9999-12-31T12:00:00Z'),
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException for an inverted window (windowEnd before windowStart)', async (): Promise<void> => {
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(
      makeOrder(OrderStatus.PLANEJADA),
    );
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);

    const window = sameDayWindow(2);
    await expect(
      useCase.execute({
        salesOrderId: 'order-id',
        deliveryDate: window.deliveryDate,
        windowStart: window.windowEnd,
        windowEnd: window.windowStart,
      }),
    ).rejects.toThrow(DomainException);
  });

  it('should create the scheduling, transition the order to AGENDADA and emit the event on success', async (): Promise<void> => {
    const order = makeOrder(OrderStatus.PLANEJADA);
    vi.mocked(mockSalesOrderRepository.findById).mockResolvedValue(order);
    vi.mocked(mockSchedulingRepository.findBySalesOrderId).mockResolvedValue(undefined);
    vi.mocked(mockSchedulingRepository.create).mockImplementation(
      (scheduling): Promise<SchedulingEntity> => Promise.resolve(scheduling),
    );
    vi.mocked(mockSalesOrderRepository.update).mockImplementation(
      (updatedOrder): Promise<SalesOrderEntity> => Promise.resolve(updatedOrder),
    );

    const window = sameDayWindow(2);
    const result = await useCase.execute({ salesOrderId: 'order-id', ...window });

    expect(result.salesOrderId).toBe('order-id');
    expect(order.status).toBe(OrderStatus.AGENDADA);
    expect(mockSchedulingRepository.create).toHaveBeenCalledOnce();
    expect(mockSalesOrderRepository.update).toHaveBeenCalledOnce();
    expect(mockOutboxRepository.enqueue).toHaveBeenCalledWith(
      'order.delivery.scheduled',
      expect.objectContaining({ orderId: 'order-id' }),
      expect.anything(),
    );
  });
});

import { OrderStatus } from '@domain/enums/order-status.enum';
import { DomainException } from '@domain/exceptions/domain.exception';
import { describe, expect, it } from 'vitest';
import { SalesOrderEntity } from './sales-order.entity';
import { SalesOrderItemEntity } from './sales-order-item.entity';

const makeSalesOrder = (status: OrderStatus): SalesOrderEntity =>
  new SalesOrderEntity({
    id: 'order-id',
    customerId: 'customer-id',
    transportTypeId: 'transport-id',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      new SalesOrderItemEntity({
        itemId: 'item-id',
        quantity: 1,
        unitPrice: 10,
      }),
    ],
  });

describe('SalesOrderEntity - State Machine', (): void => {
  it('should transition from CRIADA to PLANEJADA', (): void => {
    const order = makeSalesOrder(OrderStatus.CRIADA);
    order.transitionTo(OrderStatus.PLANEJADA);
    expect(order.status).toBe(OrderStatus.PLANEJADA);
  });

  it('should transition from PLANEJADA to AGENDADA', (): void => {
    const order = makeSalesOrder(OrderStatus.PLANEJADA);
    order.transitionTo(OrderStatus.AGENDADA);
    expect(order.status).toBe(OrderStatus.AGENDADA);
  });

  it('should transition from AGENDADA to EM_TRANSPORTE', (): void => {
    const order = makeSalesOrder(OrderStatus.AGENDADA);
    order.transitionTo(OrderStatus.EM_TRANSPORTE);
    expect(order.status).toBe(OrderStatus.EM_TRANSPORTE);
  });

  it('should transition from EM_TRANSPORTE to ENTREGUE', (): void => {
    const order = makeSalesOrder(OrderStatus.EM_TRANSPORTE);
    order.transitionTo(OrderStatus.ENTREGUE);
    expect(order.status).toBe(OrderStatus.ENTREGUE);
  });

  it('should throw DomainException when transitioning from CRIADA to ENTREGUE', (): void => {
    const order = makeSalesOrder(OrderStatus.CRIADA);
    expect((): void => order.transitionTo(OrderStatus.ENTREGUE)).toThrow(DomainException);
  });

  it('should throw DomainException when transitioning from CRIADA to AGENDADA', (): void => {
    const order = makeSalesOrder(OrderStatus.CRIADA);
    expect((): void => order.transitionTo(OrderStatus.AGENDADA)).toThrow(DomainException);
  });

  it('should throw DomainException when transitioning from ENTREGUE to any status', (): void => {
    const order = makeSalesOrder(OrderStatus.ENTREGUE);
    expect((): void => order.transitionTo(OrderStatus.CRIADA)).toThrow(DomainException);
  });

  it('should return true for canTransitionTo valid status', (): void => {
    const order = makeSalesOrder(OrderStatus.CRIADA);
    expect(order.canTransitionTo(OrderStatus.PLANEJADA)).toBe(true);
  });

  it('should return false for canTransitionTo invalid status', (): void => {
    const order = makeSalesOrder(OrderStatus.CRIADA);
    expect(order.canTransitionTo(OrderStatus.ENTREGUE)).toBe(false);
  });
});

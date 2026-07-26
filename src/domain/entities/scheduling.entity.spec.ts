import { DomainException } from '@domain/exceptions/domain.exception';
import { describe, expect, it } from 'vitest';
import { SchedulingEntity } from './scheduling.entity';

describe('SchedulingEntity.validateWindow', (): void => {
  const now = new Date('2026-06-01T00:00:00Z');

  const validInput = {
    deliveryDate: new Date('2026-06-20'),
    windowStart: new Date('2026-06-20T08:00:00Z'),
    windowEnd: new Date('2026-06-20T12:00:00Z'),
    now,
  };

  it('should accept a coherent future window', (): void => {
    expect((): void => SchedulingEntity.validateWindow(validInput)).not.toThrow();
  });

  it('should reject when start is not before end', (): void => {
    expect((): void =>
      SchedulingEntity.validateWindow({
        ...validInput,
        windowStart: new Date('2026-06-20T12:00:00Z'),
        windowEnd: new Date('2026-06-20T08:00:00Z'),
      }),
    ).toThrow(DomainException);
  });

  it('should reject a window starting in the past', (): void => {
    expect((): void =>
      SchedulingEntity.validateWindow({
        deliveryDate: new Date('2026-05-01'),
        windowStart: new Date('2026-05-01T08:00:00Z'),
        windowEnd: new Date('2026-05-01T12:00:00Z'),
        now,
      }),
    ).toThrow(DomainException);
  });

  it('should reject a delivery date beyond the max horizon', (): void => {
    expect((): void =>
      SchedulingEntity.validateWindow({
        deliveryDate: new Date('2030-06-20'),
        windowStart: new Date('2030-06-20T08:00:00Z'),
        windowEnd: new Date('2030-06-20T12:00:00Z'),
        now,
      }),
    ).toThrow(DomainException);
  });

  it('should reject when the window is not on the delivery day', (): void => {
    expect((): void =>
      SchedulingEntity.validateWindow({
        deliveryDate: new Date('2026-06-20'),
        windowStart: new Date('2026-06-21T08:00:00Z'),
        windowEnd: new Date('2026-06-21T12:00:00Z'),
        now,
      }),
    ).toThrow(DomainException);
  });
});

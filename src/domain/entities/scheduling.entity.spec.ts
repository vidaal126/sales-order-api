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

  describe('extreme and boundary dates', (): void => {
    it('should accept a window that starts exactly at "now"', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: now,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000),
          now,
        }),
      ).not.toThrow();
    });

    it('should reject a window starting 1ms before "now"', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: now,
          windowStart: new Date(now.getTime() - 1),
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should accept a delivery date exactly at the max horizon boundary', (): void => {
      const maxDate = new Date(
        now.getTime() + SchedulingEntity.MAX_SCHEDULING_HORIZON_DAYS * 24 * 60 * 60 * 1000,
      );
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: maxDate,
          windowStart: maxDate,
          windowEnd: new Date(maxDate.getTime() + 60 * 60 * 1000),
          now,
        }),
      ).not.toThrow();
    });

    it('should reject a delivery date 1ms beyond the max horizon boundary', (): void => {
      const beyondMax = new Date(
        now.getTime() + SchedulingEntity.MAX_SCHEDULING_HORIZON_DAYS * 24 * 60 * 60 * 1000 + 1,
      );
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: beyondMax,
          windowStart: beyondMax,
          windowEnd: new Date(beyondMax.getTime() + 60 * 60 * 1000),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject a delivery date very far in the past (year 1900)', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('1900-01-01'),
          windowStart: new Date('1900-01-01T08:00:00Z'),
          windowEnd: new Date('1900-01-01T12:00:00Z'),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject the earliest representable date (epoch start of JS Date range)', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date(-8640000000000000),
          windowStart: new Date(-8640000000000000),
          windowEnd: new Date(-8640000000000000 + 1000),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject a year-9999 delivery date (beyond max horizon)', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('9999-12-31T00:00:00Z'),
          windowStart: new Date('9999-12-31T08:00:00Z'),
          windowEnd: new Date('9999-12-31T12:00:00Z'),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject an invalid (NaN) deliveryDate instead of throwing an unhandled RangeError', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('not-a-date'),
          windowStart: new Date('2026-06-20T08:00:00Z'),
          windowEnd: new Date('2026-06-20T12:00:00Z'),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject an invalid (NaN) windowStart', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('2026-06-20'),
          windowStart: new Date('invalid'),
          windowEnd: new Date('2026-06-20T12:00:00Z'),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject a date beyond the maximum representable JS Date (overflow to Invalid Date)', (): void => {
      const overflowed = new Date(8640000000000001);
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: overflowed,
          windowStart: overflowed,
          windowEnd: overflowed,
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should reject a window ending 1ms after midnight UTC of the delivery day', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('2026-06-20'),
          windowStart: new Date('2026-06-20T23:00:00Z'),
          windowEnd: new Date('2026-06-21T00:00:00.001Z'),
          now,
        }),
      ).toThrow(DomainException);
    });

    it('should accept a window ending exactly at midnight UTC of the delivery day', (): void => {
      expect((): void =>
        SchedulingEntity.validateWindow({
          deliveryDate: new Date('2026-06-20'),
          windowStart: new Date('2026-06-20T23:00:00Z'),
          windowEnd: new Date('2026-06-20T23:59:59.999Z'),
          now,
        }),
      ).not.toThrow();
    });
  });
});

import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsDateAfterOrEqual } from './is-date-after-or-equal.validator';

class DummyDto {
  start!: unknown;

  @IsDateAfterOrEqual('start')
  end!: unknown;
}

const isValid = (start: unknown, end: unknown): boolean => {
  const dto = new DummyDto();
  dto.start = start;
  dto.end = end;
  return validateSync(dto).length === 0;
};

describe('IsDateAfterOrEqual', (): void => {
  it('should accept end strictly after start', (): void => {
    expect(isValid('2026-06-20T08:00:00.000Z', '2026-06-20T12:00:00.000Z')).toBe(true);
  });

  it('should accept end exactly equal to start', (): void => {
    expect(isValid('2026-06-20T08:00:00.000Z', '2026-06-20T08:00:00.000Z')).toBe(true);
  });

  it('should reject end 1ms before start', (): void => {
    expect(isValid('2026-06-20T08:00:00.000Z', '2026-06-20T07:59:59.999Z')).toBe(false);
  });

  it('should reject end before start across a distant time span (year 1900 vs 9999)', (): void => {
    expect(isValid('9999-01-01T00:00:00.000Z', '1900-01-01T00:00:00.000Z')).toBe(false);
  });

  it('should accept a very old start with an even older-but-equal end', (): void => {
    expect(isValid('1900-01-01T00:00:00.000Z', '1900-01-01T00:00:00.000Z')).toBe(true);
  });

  it('should pass (defer to @IsDateString) when start is not a parseable date', (): void => {
    expect(isValid('not-a-date', '2026-06-20T08:00:00.000Z')).toBe(true);
  });

  it('should pass (defer to @IsDateString) when end is not a parseable date', (): void => {
    expect(isValid('2026-06-20T08:00:00.000Z', 'not-a-date')).toBe(true);
  });

  it('should pass (defer to @IsDateString) when either value is not a string', (): void => {
    expect(isValid(123, '2026-06-20T08:00:00.000Z')).toBe(true);
    expect(isValid('2026-06-20T08:00:00.000Z', undefined)).toBe(true);
  });
});

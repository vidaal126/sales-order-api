import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsNotPastDate } from './is-not-past-date.validator';

class DummyDto {
  @IsNotPastDate()
  date!: unknown;
}

const isValid = (date: unknown): boolean => {
  const dto = new DummyDto();
  dto.date = date;
  return validateSync(dto).length === 0;
};

describe('IsNotPastDate', (): void => {
  it('should accept a date far in the future', (): void => {
    expect(isValid('2099-12-31T00:00:00.000Z')).toBe(true);
  });

  it('should accept an instant a few seconds in the future', (): void => {
    expect(isValid(new Date(Date.now() + 5000).toISOString())).toBe(true);
  });

  it('should reject a date 1 second in the past', (): void => {
    expect(isValid(new Date(Date.now() - 1000).toISOString())).toBe(false);
  });

  it('should reject a date very far in the past (year 1900)', (): void => {
    expect(isValid('1900-01-01T00:00:00.000Z')).toBe(false);
  });

  it('should reject the Unix epoch', (): void => {
    expect(isValid('1970-01-01T00:00:00.000Z')).toBe(false);
  });

  it('should accept a year-9999 date (no upper bound enforced by this validator)', (): void => {
    expect(isValid('9999-12-31T00:00:00.000Z')).toBe(true);
  });

  it('should reject a non-date string', (): void => {
    expect(isValid('not-a-date')).toBe(false);
  });

  it('should reject an empty string', (): void => {
    expect(isValid('')).toBe(false);
  });

  it('should reject a non-string value', (): void => {
    expect(isValid(12345)).toBe(false);
    expect(isValid(null)).toBe(false);
    expect(isValid(undefined)).toBe(false);
  });
});

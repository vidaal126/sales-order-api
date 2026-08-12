import { describe, expect, it } from 'vitest';
import { isValidCpf } from './cpf';

describe('isValidCpf', (): void => {
  it('should accept a valid CPF with mask', (): void => {
    expect(isValidCpf('123.456.789-09')).toBe(true);
  });

  it('should accept a valid CPF without mask', (): void => {
    expect(isValidCpf('12345678909')).toBe(true);
  });

  it('should reject a well-formatted CPF with wrong check digits', (): void => {
    expect(isValidCpf('123.456.789-00')).toBe(false);
  });

  it('should reject repeated-digit sequences', (): void => {
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('should reject values without exactly 11 digits', (): void => {
    expect(isValidCpf('123456')).toBe(false);
    expect(isValidCpf('123456789012')).toBe(false);
  });

  it('should reject non-string input', (): void => {
    expect(isValidCpf(12345678909)).toBe(false);
    expect(isValidCpf(null)).toBe(false);
    expect(isValidCpf(undefined)).toBe(false);
  });
});

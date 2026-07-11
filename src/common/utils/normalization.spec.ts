import { describe, expect, it } from 'vitest';
import { normalizeCpf, normalizePhone } from './normalization';

describe('Normalization Utilities', (): void => {
  describe('normalizeCpf', (): void => {
    it('should format raw 11 digits to CPF format', (): void => {
      expect(normalizeCpf('12345678909')).toBe('123.456.789-09');
    });

    it('should strip special characters and format to CPF format', (): void => {
      expect(normalizeCpf('123-456.789/09')).toBe('123.456.789-09');
    });

    it('should return the original value if it does not have exactly 11 digits', (): void => {
      expect(normalizeCpf('12345')).toBe('12345');
      expect(normalizeCpf('123456789012')).toBe('123456789012');
    });

    it('should handle non-string inputs gracefully', (): void => {
      expect(normalizeCpf(12345678909)).toBe(12345678909);
      expect(normalizeCpf(null)).toBe(null);
    });
  });

  describe('normalizePhone', (): void => {
    it('should format raw 11 digits to mobile phone format', (): void => {
      expect(normalizePhone('61999999999')).toBe('(61) 99999-9999');
    });

    it('should format raw 10 digits to landline phone format', (): void => {
      expect(normalizePhone('6133221100')).toBe('(61) 3322-1100');
    });

    it('should strip special characters and format to correct phone format', (): void => {
      expect(normalizePhone('61-99999-9999')).toBe('(61) 99999-9999');
      expect(normalizePhone('(61) 3322 1100')).toBe('(61) 3322-1100');
    });

    it('should return the original value if it does not have 10 or 11 digits', (): void => {
      expect(normalizePhone('12345')).toBe('12345');
    });

    it('should handle non-string inputs gracefully', (): void => {
      expect(normalizePhone(61999999999)).toBe(61999999999);
      expect(normalizePhone(undefined)).toBe(undefined);
    });
  });
});

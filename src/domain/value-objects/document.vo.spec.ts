import { DomainException } from '@domain/exceptions/domain.exception';
import { describe, expect, it } from 'vitest';
import { Document } from './document.vo';

describe('Document', (): void => {
  it('should accept a valid CPF already formatted with mask', (): void => {
    expect(Document.create('123.456.789-09').value).toBe('123.456.789-09');
  });

  it('should normalize and accept a valid CPF without mask', (): void => {
    expect(Document.create('12345678909').value).toBe('123.456.789-09');
  });

  it('should reject a CPF with wrong check digits', (): void => {
    expect((): Document => Document.create('123.456.789-00')).toThrow(DomainException);
  });

  it('should reject a repeated-digit sequence (000.000.000-00)', (): void => {
    expect((): Document => Document.create('000.000.000-00')).toThrow(DomainException);
  });

  it('should reject a document shorter than 11 digits', (): void => {
    expect((): Document => Document.create('123')).toThrow(DomainException);
  });

  it('should reject a document longer than 11 digits', (): void => {
    expect((): Document => Document.create('123456789012')).toThrow(DomainException);
  });

  it('should reject an arbitrary non-numeric string', (): void => {
    expect((): Document => Document.create('abc-invalido')).toThrow(DomainException);
  });

  it('should reject an empty string', (): void => {
    expect((): Document => Document.create('')).toThrow(DomainException);
  });
});

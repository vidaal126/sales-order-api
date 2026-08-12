import { DomainException } from '@domain/exceptions/domain.exception';
import { describe, expect, it } from 'vitest';
import { Phone } from './phone.vo';

describe('Phone', (): void => {
  it('should accept a valid mobile phone already formatted', (): void => {
    expect(Phone.create('(11) 98765-4321').value).toBe('(11) 98765-4321');
  });

  it('should accept a valid landline number already formatted', (): void => {
    expect(Phone.create('(11) 3456-7890').value).toBe('(11) 3456-7890');
  });

  it('should normalize and accept a valid phone without mask', (): void => {
    expect(Phone.create('11987654321').value).toBe('(11) 98765-4321');
  });

  it('should reject an arbitrary non-numeric string', (): void => {
    expect((): Phone => Phone.create('nao-e-telefone')).toThrow(DomainException);
  });

  it('should reject a phone number that is too short', (): void => {
    expect((): Phone => Phone.create('123')).toThrow(DomainException);
  });

  it('should reject an empty string', (): void => {
    expect((): Phone => Phone.create('')).toThrow(DomainException);
  });
});

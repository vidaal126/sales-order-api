import { normalizePhone } from '@common/utils/normalization';
import { DomainException } from '@domain/exceptions/domain.exception';

const PHONE_PATTERN = /^\(\d{2}\) \d{4,5}-\d{4}$/;

export class Phone {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Phone {
    const normalized = typeof value === 'string' ? (normalizePhone(value) as string) : value;
    if (!PHONE_PATTERN.test(normalized)) {
      throw new DomainException(`Telefone ${value} inválido: formato esperado (XX) XXXXX-XXXX.`);
    }
    return new Phone(normalized);
  }
}

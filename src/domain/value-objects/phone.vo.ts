import { DomainException } from '@domain/exceptions/domain.exception';

const PHONE_PATTERN = /^\(\d{2}\) \d{4,5}-\d{4}$/;

export class Phone {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Phone {
    if (!PHONE_PATTERN.test(value)) {
      throw new DomainException(`Telefone ${value} inválido: formato esperado (XX) XXXXX-XXXX.`);
    }
    return new Phone(value);
  }
}

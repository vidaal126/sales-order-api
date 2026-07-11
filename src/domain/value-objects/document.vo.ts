import { normalizeCpf } from '@common/utils/normalization';
import { DomainException } from '@domain/exceptions/domain.exception';

const DOCUMENT_PATTERN = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export class Document {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Document {
    const normalized = typeof value === 'string' ? (normalizeCpf(value) as string) : value;
    if (!DOCUMENT_PATTERN.test(normalized)) {
      throw new DomainException(`Documento ${value} inválido: formato esperado XXX.XXX.XXX-XX.`);
    }
    return new Document(normalized);
  }
}

import { DomainException } from "@domain/exceptions/domain.exception";

const DOCUMENT_PATTERN = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export class Document {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Document {
    if (!DOCUMENT_PATTERN.test(value)) {
      throw new DomainException(
        `Documento ${value} inválido: formato esperado XXX.XXX.XXX-XX.`,
      );
    }
    return new Document(value);
  }
}

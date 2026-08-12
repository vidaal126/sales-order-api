import { DomainException } from '@domain/exceptions/domain.exception';

export class DomainNotFoundException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DomainNotFoundException';
  }
}

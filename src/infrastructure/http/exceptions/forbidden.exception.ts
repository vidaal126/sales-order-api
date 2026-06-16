export class DomainForbiddenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainForbiddenException';
  }
}

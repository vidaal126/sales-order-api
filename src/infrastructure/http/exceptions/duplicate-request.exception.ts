export class DuplicateRequestException extends Error {
  readonly existingResourceId: string;

  constructor(message: string, existingResourceId: string) {
    super(message);
    this.name = 'DuplicateRequestException';
    this.existingResourceId = existingResourceId;
  }
}

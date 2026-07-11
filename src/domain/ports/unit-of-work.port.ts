export abstract class IUnitOfWork {
  abstract execute<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}

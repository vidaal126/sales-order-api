export type TransactionContext = unknown;

export interface IUnitOfWork {
  execute<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T>;
}

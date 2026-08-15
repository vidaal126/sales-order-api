import type { OutboxEventEntity } from '@domain/entities/outbox-event.entity';
import type { TransactionContext } from '@domain/ports/unit-of-work.port';

export interface IOutboxRepository {
  enqueue(eventName: string, payload: unknown, transaction?: TransactionContext): Promise<void>;
  findUnpublished(limit: number): Promise<OutboxEventEntity[]>;
  markPublished(ids: string[]): Promise<void>;
}

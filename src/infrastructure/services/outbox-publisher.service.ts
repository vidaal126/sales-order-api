import type { IEventEmitter } from '@domain/events/event-emitter.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import { EVENT_EMITTER, OUTBOX_REPOSITORY } from '@infrastructure/di-tokens';
import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';

const POLL_INTERVAL_MS = 5_000;
const BATCH_SIZE = 50;

@Injectable()
export class OutboxPublisherService {
  constructor(
    @Inject(OUTBOX_REPOSITORY) private readonly outboxRepository: IOutboxRepository,
    @Inject(EVENT_EMITTER) private readonly eventEmitter: IEventEmitter,
    @InjectPinoLogger(OutboxPublisherService.name)
    private readonly logger: PinoLogger,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async publishPending(): Promise<void> {
    const pending = await this.outboxRepository.findUnpublished(BATCH_SIZE);
    if (pending.length === 0) return;

    const publishedIds: string[] = [];
    for (const event of pending) {
      try {
        this.eventEmitter.emit(event.eventName, event.payload);
        publishedIds.push(event.id);
      } catch (err: unknown) {
        this.logger.error(
          {
            err,
            service: OutboxPublisherService.name,
            method: 'publishPending',
            eventId: event.id,
            eventName: event.eventName,
          },
          'Failed to publish outbox event',
        );
      }
    }

    if (publishedIds.length > 0) {
      await this.outboxRepository.markPublished(publishedIds);
    }
  }
}

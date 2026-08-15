import { OutboxEventEntity } from '@domain/entities/outbox-event.entity';
import type { IEventEmitter } from '@domain/events/event-emitter.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutboxPublisherService } from './outbox-publisher.service';

const mockOutboxRepository: IOutboxRepository = {
  enqueue: vi.fn(),
  findUnpublished: vi.fn(),
  markPublished: vi.fn(),
};

const mockEventEmitter: IEventEmitter = {
  emit: vi.fn(),
};

const mockLogger = { error: vi.fn() } as unknown as PinoLogger;

const makeEvent = (id: string, eventName = 'order.created'): OutboxEventEntity =>
  new OutboxEventEntity({ id, eventName, payload: { orderId: id }, createdAt: new Date() });

describe('OutboxPublisherService', (): void => {
  let service: OutboxPublisherService;

  beforeEach((): void => {
    vi.clearAllMocks();
    service = new OutboxPublisherService(mockOutboxRepository, mockEventEmitter, mockLogger);
  });

  it('should do nothing when there are no pending events', async (): Promise<void> => {
    vi.mocked(mockOutboxRepository.findUnpublished).mockResolvedValue([]);

    await service.publishPending();

    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    expect(mockOutboxRepository.markPublished).not.toHaveBeenCalled();
  });

  it('should emit each pending event and mark the batch as published', async (): Promise<void> => {
    const events = [makeEvent('event-1'), makeEvent('event-2')];
    vi.mocked(mockOutboxRepository.findUnpublished).mockResolvedValue(events);

    await service.publishPending();

    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', { orderId: 'event-1' });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', { orderId: 'event-2' });
    expect(mockOutboxRepository.markPublished).toHaveBeenCalledWith(['event-1', 'event-2']);
  });

  it('should log the failure and skip marking as published when emit throws for one event', async (): Promise<void> => {
    const events = [makeEvent('event-1'), makeEvent('event-2')];
    vi.mocked(mockOutboxRepository.findUnpublished).mockResolvedValue(events);
    vi.mocked(mockEventEmitter.emit).mockImplementationOnce((): void => {
      throw new Error('listener exploded');
    });

    await service.publishPending();

    expect(mockLogger.error).toHaveBeenCalledOnce();
    expect(mockOutboxRepository.markPublished).toHaveBeenCalledWith(['event-2']);
  });
});

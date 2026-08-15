import { OutboxEventEntity } from '@domain/entities/outbox-event.entity';
import type { TransactionContext } from '@domain/ports/unit-of-work.port';
import type { IOutboxRepository } from '@domain/repositories/outbox.repository';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async enqueue(
    eventName: string,
    payload: unknown,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = (transaction as Prisma.TransactionClient) ?? this.prisma;
    await client.outboxEvent.create({
      data: { eventName, payload: payload as Prisma.InputJsonValue },
    });
  }

  async findUnpublished(limit: number): Promise<OutboxEventEntity[]> {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(
      (row): OutboxEventEntity =>
        new OutboxEventEntity({
          id: row.id,
          eventName: row.eventName,
          payload: row.payload,
          createdAt: row.createdAt,
          publishedAt: row.publishedAt ?? undefined,
        }),
    );
  }

  async markPublished(ids: string[]): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: { id: { in: ids } },
      data: { publishedAt: new Date() },
    });
  }
}

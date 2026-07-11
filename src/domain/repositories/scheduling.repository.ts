import type { SchedulingEntity } from '@domain/entities/scheduling.entity';

export abstract class ISchedulingRepository {
  abstract create(scheduling: SchedulingEntity, tx?: unknown): Promise<SchedulingEntity>;
  abstract findBySalesOrderId(
    salesOrderId: string,
    tx?: unknown,
  ): Promise<SchedulingEntity | undefined>;
  abstract update(scheduling: SchedulingEntity, tx?: unknown): Promise<SchedulingEntity>;
}

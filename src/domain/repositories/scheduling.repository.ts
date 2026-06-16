import type { SchedulingEntity } from '@domain/entities/scheduling.entity';

export abstract class ISchedulingRepository {
  abstract findBySalesOrderId(salesOrderId: string): Promise<SchedulingEntity | undefined>;
  abstract create(scheduling: SchedulingEntity): Promise<SchedulingEntity>;
  abstract update(scheduling: SchedulingEntity): Promise<SchedulingEntity>;
}

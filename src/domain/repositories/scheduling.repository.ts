import { SchedulingEntity } from '@domain/entities/scheduling.entity';
import type { TransactionContext } from '@domain/ports/unit-of-work.port';

export interface ISchedulingRepository {
  findBySalesOrderId(
    salesOrderId: string,
    transaction?: TransactionContext,
  ): Promise<SchedulingEntity | undefined>;
  create(scheduling: SchedulingEntity, transaction?: TransactionContext): Promise<SchedulingEntity>;
  update(scheduling: SchedulingEntity, transaction?: TransactionContext): Promise<SchedulingEntity>;
}

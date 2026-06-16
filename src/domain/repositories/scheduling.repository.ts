import { SchedulingEntity } from '@domain/entities/scheduling.entity';

export interface ISchedulingRepository {
  findBySalesOrderId(salesOrderId: string): Promise<SchedulingEntity | undefined>;
  create(scheduling: SchedulingEntity): Promise<SchedulingEntity>;
  update(scheduling: SchedulingEntity): Promise<SchedulingEntity>;
}

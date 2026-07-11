import type { TransportTypeEntity } from '@domain/entities/transport-type.entity';

export abstract class ITransportTypeRepository {
  abstract findById(id: string): Promise<TransportTypeEntity | undefined>;
  abstract findByIds(ids: string[]): Promise<TransportTypeEntity[]>;
  abstract findAll(): Promise<TransportTypeEntity[]>;
  abstract findByName(name: string): Promise<TransportTypeEntity | undefined>;
  abstract create(transportType: TransportTypeEntity): Promise<TransportTypeEntity>;
  abstract update(transportType: TransportTypeEntity): Promise<TransportTypeEntity>;
}

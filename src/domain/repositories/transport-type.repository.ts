import { TransportTypeEntity } from '@domain/entities/transport-type.entity';

export interface ITransportTypeRepository {
  findById(id: string): Promise<TransportTypeEntity | undefined>;
  findAll(): Promise<TransportTypeEntity[]>;
  findByName(name: string): Promise<TransportTypeEntity | undefined>;
  create(transportType: TransportTypeEntity): Promise<TransportTypeEntity>;
  update(transportType: TransportTypeEntity): Promise<TransportTypeEntity>;
}

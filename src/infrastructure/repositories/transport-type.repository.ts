import { TransportTypeEntity } from '@domain/entities/transport-type.entity';
import { ITransportTypeRepository } from '@domain/repositories/transport-type.repository';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class TransportTypeRepository extends ITransportTypeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<TransportTypeEntity | undefined> {
    const transportType = await this.prisma.transportType.findUnique({ where: { id } });
    if (!transportType) return undefined;
    return new TransportTypeEntity({
      id: transportType.id,
      name: transportType.name,
      description: transportType.description ?? undefined,
      createdAt: transportType.createdAt,
      updatedAt: transportType.updatedAt,
    });
  }

  async findByIds(ids: string[]): Promise<TransportTypeEntity[]> {
    const transportTypes = await this.prisma.transportType.findMany({
      where: { id: { in: ids } },
    });
    return transportTypes.map(
      (transportType): TransportTypeEntity =>
        new TransportTypeEntity({
          id: transportType.id,
          name: transportType.name,
          description: transportType.description ?? undefined,
          createdAt: transportType.createdAt,
          updatedAt: transportType.updatedAt,
        }),
    );
  }

  async findByName(name: string): Promise<TransportTypeEntity | undefined> {
    const transportType = await this.prisma.transportType.findUnique({ where: { name } });
    if (!transportType) return undefined;
    return new TransportTypeEntity({
      id: transportType.id,
      name: transportType.name,
      description: transportType.description ?? undefined,
      createdAt: transportType.createdAt,
      updatedAt: transportType.updatedAt,
    });
  }

  async findAll(): Promise<TransportTypeEntity[]> {
    const transportTypes = await this.prisma.transportType.findMany();
    return transportTypes.map(
      (t): TransportTypeEntity =>
        new TransportTypeEntity({
          id: t.id,
          name: t.name,
          description: t.description ?? undefined,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }),
    );
  }

  async create(transportType: TransportTypeEntity): Promise<TransportTypeEntity> {
    const created = await this.prisma.transportType.create({
      data: {
        id: transportType.id,
        name: transportType.name,
        description: transportType.description,
      },
    });
    return new TransportTypeEntity({
      id: created.id,
      name: created.name,
      description: created.description ?? undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async update(transportType: TransportTypeEntity): Promise<TransportTypeEntity> {
    const updated = await this.prisma.transportType.update({
      where: { id: transportType.id },
      data: { name: transportType.name, description: transportType.description },
    });
    return new TransportTypeEntity({
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }
}

import { CustomerEntity } from '@domain/entities/customer.entity';
import type { ICustomerRepository } from '@domain/repositories/customer.repository';
import { type PaginationParams, resolvePageSize } from '@domain/repositories/pagination';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: unknown): Promise<CustomerEntity | undefined> {
    const client = (tx as Prisma.TransactionClient) ?? this.prisma;
    const customer = await client.customer.findUnique({
      where: { id },
      include: { authorizedTransports: true },
    });
    if (!customer) return undefined;
    return new CustomerEntity({
      id: customer.id,
      name: customer.name,
      document: customer.document,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      authorizedTransportTypeIds: customer.authorizedTransports.map(
        (t): string => t.transportTypeId,
      ),
    });
  }

  async findByDocument(document: string): Promise<CustomerEntity | undefined> {
    const customer = await this.prisma.customer.findUnique({
      where: { document },
      include: { authorizedTransports: true },
    });
    if (!customer) return undefined;
    return new CustomerEntity({
      id: customer.id,
      name: customer.name,
      document: customer.document,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      authorizedTransportTypeIds: customer.authorizedTransports.map(
        (t): string => t.transportTypeId,
      ),
    });
  }

  async findAll(params?: PaginationParams): Promise<CustomerEntity[]> {
    const limit = resolvePageSize(params?.limit);
    const page = params?.page ?? 1;
    const customers = await this.prisma.customer.findMany({
      include: { authorizedTransports: true },
      take: limit,
      skip: (page - 1) * limit,
    });
    return customers.map(
      (customer): CustomerEntity =>
        new CustomerEntity({
          id: customer.id,
          name: customer.name,
          document: customer.document,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          authorizedTransportTypeIds: customer.authorizedTransports.map(
            (t): string => t.transportTypeId,
          ),
        }),
    );
  }

  async create(customer: CustomerEntity): Promise<CustomerEntity> {
    const created = await this.prisma.customer.create({
      data: {
        id: customer.id,
        name: customer.name,
        document: customer.document,
        email: customer.email,
        phone: customer.phone,
        authorizedTransports: {
          create: customer.authorizedTransportTypeIds.map(
            (transportTypeId): { transportTypeId: string } => ({
              transportTypeId,
            }),
          ),
        },
      },
      include: { authorizedTransports: true },
    });
    return new CustomerEntity({
      id: created.id,
      name: created.name,
      document: created.document,
      email: created.email ?? undefined,
      phone: created.phone ?? undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      authorizedTransportTypeIds: created.authorizedTransports.map(
        (t): string => t.transportTypeId,
      ),
    });
  }

  async update(customer: CustomerEntity): Promise<CustomerEntity> {
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        authorizedTransports: {
          deleteMany: {},
          create: customer.authorizedTransportTypeIds.map(
            (transportTypeId): { transportTypeId: string } => ({
              transportTypeId,
            }),
          ),
        },
      },
      include: { authorizedTransports: true },
    });
    return new CustomerEntity({
      id: updated.id,
      name: updated.name,
      document: updated.document,
      email: updated.email ?? undefined,
      phone: updated.phone ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      authorizedTransportTypeIds: updated.authorizedTransports.map(
        (t): string => t.transportTypeId,
      ),
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma/prisma.service";
import { ICustomerRepository } from "@domain/repositories/customer.repository";
import { CustomerEntity } from "@domain/entities/customer.entity";

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CustomerEntity | undefined> {
    const customer = await this.prisma.customer.findUnique({
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
        (t) => t.transportTypeId,
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
        (t) => t.transportTypeId,
      ),
    });
  }

  async findAll(): Promise<CustomerEntity[]> {
    const customers = await this.prisma.customer.findMany({
      include: { authorizedTransports: true },
    });

    return customers.map(
      (customer) =>
        new CustomerEntity({
          id: customer.id,
          name: customer.name,
          document: customer.document,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          authorizedTransportTypeIds: customer.authorizedTransports.map(
            (t) => t.transportTypeId,
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
            (transportTypeId) => ({
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
        (t) => t.transportTypeId,
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
            (transportTypeId) => ({
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
        (t) => t.transportTypeId,
      ),
    });
  }
}

import { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUnitOfWork extends IUnitOfWork {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  execute<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}

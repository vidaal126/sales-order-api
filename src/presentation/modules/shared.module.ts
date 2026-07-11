import { IUnitOfWork } from '@domain/ports/unit-of-work.port';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../infrastructure/database/prisma/prisma-unit-of-work';

@Global()
@Module({
  providers: [PrismaService, { provide: IUnitOfWork, useClass: PrismaUnitOfWork }],
  exports: [PrismaService, IUnitOfWork],
})
export class SharedModule {}

import { UNIT_OF_WORK } from '@infrastructure/di-tokens';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../infrastructure/database/prisma/prisma-unit-of-work';

@Global()
@Module({
  providers: [PrismaService, { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork }],
  exports: [PrismaService, UNIT_OF_WORK],
})
export class SharedModule {}

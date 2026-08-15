import { REDIS_CLIENT, UNIT_OF_WORK } from '@infrastructure/di-tokens';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../infrastructure/database/prisma/prisma-unit-of-work';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => new Redis(config.getOrThrow('REDIS_URL')),
    },
  ],
  exports: [PrismaService, UNIT_OF_WORK, REDIS_CLIENT],
})
export class SharedModule {}

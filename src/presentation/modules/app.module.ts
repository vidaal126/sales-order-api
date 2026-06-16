import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import type { LevelWithSilent } from 'pino';
import { envValidationSchema } from '../../config/env.validation';
import { HttpExceptionFilter } from '../../infrastructure/http/filters/http-exception.filter';
import { ThrottlerBehindProxyGuard } from '../../infrastructure/http/guards/throttler-behind-proxy.guard';
import { TraceIdInterceptor } from '../../infrastructure/http/interceptors/trace-id.interceptor';
import { TransformResponseInterceptor } from '../../infrastructure/http/interceptors/transform-response.interceptor';
import { CustomerModule } from './customer.module';
import { ItemModule } from './item.module';
import { SalesOrderModule } from './sales-order.module';
import { SharedModule } from './shared.module';
import { TransportTypeModule } from './transport-type.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): Record<string, unknown> => ({
        forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          customAttributeKeys: { responseTime: 'duration' },
          customLogLevel: (
            _req: IncomingMessage,
            res: ServerResponse,
            err: Error | undefined,
          ): LevelWithSilent => {
            if (res.statusCode >= 500 || err) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          autoLogging: {
            ignore: (req: IncomingMessage): boolean => req.url === '/health',
          },
          serializers: {
            req: (): Record<string, never> => ({}),
            res: (): Record<string, never> => ({}),
          },
          customProps: (req: IncomingMessage): Record<string, unknown> => ({
            traceId: (req as IncomingMessage & { traceId?: string }).traceId,
            route:
              (req as IncomingMessage & { routeOptions?: { url?: string } }).routeOptions?.url ??
              req.url,
          }),
          redact: { paths: ['req', 'res'], remove: true },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    EventEmitterModule.forRoot(),
    SharedModule,
    CustomerModule,
    TransportTypeModule,
    ItemModule,
    SalesOrderModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
    { provide: APP_INTERCEPTOR, useClass: TraceIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class AppModule {}

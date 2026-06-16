import helmet from '@fastify/helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { collectDefaultMetrics, register } from 'prom-client';
import { AppModule } from './presentation/modules/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const isDev = config.get<string>('NODE_ENV') === 'development';
  const corsOrigins = config
    .get<string>('CORS_ORIGIN', '')
    .split(',')
    .map((o): string => o.trim())
    .filter(Boolean);

  await app.register(helmet, {
    hsts: isDev ? false : { maxAge: 31_536_000, includeSubDomains: true },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `'unsafe-inline'`],
      },
    },
  });

  app.enableCors({
    origin: (requestOrigin, callback): void => {
      if (
        !requestOrigin ||
        corsOrigins.includes(requestOrigin) ||
        (isDev && /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin))
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'Idempotency-Key'],
    exposedHeaders: ['X-Trace-Id'],
    credentials: false,
    maxAge: 86_400,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sales Order API')
      .setDescription('Sales order management API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }

  collectDefaultMetrics();

  const server = app.getHttpAdapter().getInstance();
  server.get('/metrics', async (_request, reply): Promise<void> => {
    reply.header('Content-Type', register.contentType);
    await reply.send(await register.metrics());
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();

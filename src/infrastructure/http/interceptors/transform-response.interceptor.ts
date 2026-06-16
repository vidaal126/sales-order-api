import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import type { RequestWithTrace } from './trace-id.interceptor';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & RequestWithTrace>();
    const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((data: unknown) => ({
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        traceId: request.traceId,
        data,
      })),
    );
  }
}

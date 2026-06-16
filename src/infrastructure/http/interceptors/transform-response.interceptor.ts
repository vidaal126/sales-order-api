import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { RequestWithTrace } from './trace-id.interceptor';

interface ResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  traceId: string | undefined;
  data: unknown;
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & RequestWithTrace>();
    const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map(
        (data: unknown): ResponseBody => ({
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          traceId: request.traceId,
          data,
        }),
      ),
    );
  }
}

import { randomUUID } from 'node:crypto';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';

export interface RequestWithTrace extends FastifyRequest {
  traceId?: string;
}

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithTrace>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const traceId = (request.headers['x-trace-id'] as string) ?? randomUUID();
    request.traceId = traceId;
    void reply.header('X-Trace-Id', traceId);
    return next.handle();
  }
}

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

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

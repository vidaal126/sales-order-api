import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { getToken } from '@willsoto/nestjs-prometheus';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Counter, Histogram } from 'prom-client';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @Inject(getToken('http_requests_total'))
    private readonly requestsCounter: Counter<string>,
    @Inject(getToken('http_request_duration_seconds'))
    private readonly requestDuration: Histogram<string>,
    @Inject(getToken('http_errors_total'))
    private readonly errorsCounter: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest & { routeOptions?: { url?: string } }>();
    const res = http.getResponse<FastifyReply>();
    const method = req.method;
    const route = req.routeOptions?.url ?? req.url;

    const end = this.requestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap((): void => {
        const statusCode = String(res.statusCode);
        end({ status_code: statusCode });
        this.requestsCounter.inc({ method, route, status_code: statusCode });
        if (res.statusCode >= 400) {
          this.errorsCounter.inc({ method, route, status_code: statusCode });
        }
      }),
    );
  }
}

import { REDIS_CLIENT } from '@infrastructure/di-tokens';
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type Redis from 'ioredis';
import { type Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DuplicateRequestException } from '../exceptions/duplicate-request.exception';
import { ValidationException } from '../exceptions/validation.exception';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
const IDEMPOTENCY_TTL_SECONDS = 86_400;
const PROCESSING_PLACEHOLDER = '__processing__';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers[IDEMPOTENCY_KEY_HEADER];
    const idempotencyKey = Array.isArray(header) ? header[0] : header;

    if (!idempotencyKey) {
      return next.handle();
    }

    if (idempotencyKey.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
      throw new ValidationException(
        `Header Idempotency-Key não pode exceder ${IDEMPOTENCY_KEY_MAX_LENGTH} caracteres.`,
      );
    }

    const redisKey = `idempotency:${idempotencyKey}`;
    const claimed = await this.redis.set(
      redisKey,
      PROCESSING_PLACEHOLDER,
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
      'NX',
    );

    if (!claimed) {
      const cached = await this.redis.get(redisKey);
      if (cached && cached !== PROCESSING_PLACEHOLDER) {
        return of(JSON.parse(cached));
      }
      throw new DuplicateRequestException('Requisição já está em processamento.', idempotencyKey);
    }

    return next.handle().pipe(
      tap({
        next: (result: unknown): void => {
          void this.redis.set(redisKey, JSON.stringify(result), 'EX', IDEMPOTENCY_TTL_SECONDS);
        },
        // A falha não deve travar a chave como "processing" até o TTL expirar —
        // sem isso, um retry legítimo após um erro real ficaria bloqueado por 24h.
        error: (): void => {
          void this.redis.del(redisKey);
        },
      }),
    );
  }
}

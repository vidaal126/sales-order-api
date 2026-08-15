import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type Redis from 'ioredis';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateRequestException } from '../exceptions/duplicate-request.exception';
import { ValidationException } from '../exceptions/validation.exception';
import { IdempotencyInterceptor } from './idempotency.interceptor';

const makeContext = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: (): { getRequest: () => { headers: Record<string, string> } } => ({
      getRequest: (): { headers: Record<string, string> } => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

const makeCallHandler = (result: unknown): CallHandler =>
  ({
    handle: (): ReturnType<CallHandler['handle']> => of(result),
  }) as CallHandler;

describe('IdempotencyInterceptor', (): void => {
  let redis: Redis;
  let interceptor: IdempotencyInterceptor;

  beforeEach((): void => {
    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    } as unknown as Redis;
    interceptor = new IdempotencyInterceptor(redis);
  });

  it('should call the handler directly when no Idempotency-Key header is sent', async (): Promise<void> => {
    const handler = makeCallHandler({ id: 'order-1' });

    const result$ = await interceptor.intercept(makeContext({}), handler);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ id: 'order-1' });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should throw ValidationException when the key exceeds the max length', async (): Promise<void> => {
    const handler = makeCallHandler({ id: 'order-1' });
    const longKey = 'a'.repeat(129);

    await expect(
      interceptor.intercept(makeContext({ 'idempotency-key': longKey }), handler),
    ).rejects.toThrow(ValidationException);
  });

  it('should execute the handler and cache the response when the key is claimed', async (): Promise<void> => {
    vi.mocked(redis.set).mockResolvedValueOnce('OK');
    const handler = makeCallHandler({ id: 'order-1' });

    const result$ = await interceptor.intercept(
      makeContext({ 'idempotency-key': 'key-1' }),
      handler,
    );
    await firstValueFrom(result$);

    expect(redis.set).toHaveBeenNthCalledWith(
      1,
      'idempotency:key-1',
      '__processing__',
      'EX',
      86_400,
      'NX',
    );
    expect(redis.set).toHaveBeenNthCalledWith(
      2,
      'idempotency:key-1',
      JSON.stringify({ id: 'order-1' }),
      'EX',
      86_400,
    );
  });

  it('should return the cached response on replay without calling the handler', async (): Promise<void> => {
    vi.mocked(redis.set).mockResolvedValueOnce(null as never);
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify({ id: 'order-1' }));
    const handler = makeCallHandler({ id: 'should-not-be-used' });

    const result$ = await interceptor.intercept(
      makeContext({ 'idempotency-key': 'key-1' }),
      handler,
    );
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ id: 'order-1' });
  });

  it('should throw DuplicateRequestException for a concurrent in-flight duplicate', async (): Promise<void> => {
    vi.mocked(redis.set).mockResolvedValueOnce(null as never);
    vi.mocked(redis.get).mockResolvedValueOnce('__processing__');
    const handler = makeCallHandler({ id: 'order-1' });

    await expect(
      interceptor.intercept(makeContext({ 'idempotency-key': 'key-1' }), handler),
    ).rejects.toThrow(DuplicateRequestException);
  });
});

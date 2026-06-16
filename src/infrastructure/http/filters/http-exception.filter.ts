import { DomainException } from '@domain/exceptions/domain.exception';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';
import { BusinessRuleException } from '../exceptions/business-rule.exception';
import { DuplicateRequestException } from '../exceptions/duplicate-request.exception';
import { ExternalServiceException } from '../exceptions/external-service.exception';
import { DomainForbiddenException } from '../exceptions/forbidden.exception';
import { DomainNotFoundException } from '../exceptions/not-found.exception';
import { DomainUnauthorizedException } from '../exceptions/unauthorized.exception';
import { ValidationException } from '../exceptions/validation.exception';
import type { RequestWithTrace } from '../interceptors/trace-id.interceptor';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<RequestWithTrace>();

    const traceId = request.traceId ?? '';
    const status = this.resolveHttpStatus(exception);
    const message = this.resolveErrorMessage(exception);
    const errorName = this.resolveErrorName(exception);

    if (status >= 500) {
      this.logger.error(
        { err: exception, traceId, method: request.method, url: request.url },
        message,
      );
    }

    if (exception instanceof DuplicateRequestException) {
      void reply.header('X-Resource-Id', exception.existingResourceId);
    }

    void reply.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      traceId,
      error: { message, error: errorName, statusCode: status },
    });
  }

  private resolveHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof DuplicateRequestException) return HttpStatus.CONFLICT;
    if (exception instanceof DomainNotFoundException) return HttpStatus.NOT_FOUND;
    if (exception instanceof ValidationException) return HttpStatus.BAD_REQUEST;
    if (exception instanceof DomainUnauthorizedException) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof DomainForbiddenException) return HttpStatus.FORBIDDEN;
    if (exception instanceof BusinessRuleException) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (exception instanceof ExternalServiceException) return HttpStatus.BAD_GATEWAY;
    if (exception instanceof DomainException) return HttpStatus.UNPROCESSABLE_ENTITY; // ← adiciona
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as { message: string | string[] }).message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
      }
    }
    if (exception instanceof Error) return exception.message;
    return 'Internal server error';
  }

  private resolveErrorName(exception: unknown): string {
    if (exception instanceof HttpException) return exception.constructor.name;
    if (exception instanceof DomainException) return exception.constructor.name;
    return 'InternalServerError';
  }
}

import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Documenta o envelope padrão aplicado a toda resposta de sucesso pelo
 * TransformResponseInterceptor, com o recurso real aninhado em `data`.
 *
 * Use `isArray` para endpoints de listagem, em que `data` é uma coleção.
 */
export function ApiStandardResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: { status: number; description: string; isArray?: boolean },
): MethodDecorator & ClassDecorator {
  const dataSchema = options.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: options.status },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string', example: '/api/v1/sales-orders' },
          traceId: {
            type: 'string',
            description: 'Correlaciona a resposta com os logs estruturados da aplicação.',
          },
          data: dataSchema,
        },
      },
    }),
  );
}

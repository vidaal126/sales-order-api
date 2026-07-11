import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default(''),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error').default('info'),
  METRICS_TOKEN: Joi.string().required(),
});

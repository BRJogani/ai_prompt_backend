import pino from 'pino';
import { env, isProduction } from './env';

/**
 * Application-wide structured logger.
 * - Pretty printed in development for readability.
 * - Plain JSON in production for log aggregators (Render, Datadog, etc.).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
  base: {
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    remove: true,
  },
});

export default logger;

import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger } from '@config/logger';

/**
 * Attaches a per-request logger (req.log) and logs each request/response
 * with a correlation id, so individual requests can be traced through logs.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health' || req.url === '/favicon.ico',
  },
});

export default requestLogger;

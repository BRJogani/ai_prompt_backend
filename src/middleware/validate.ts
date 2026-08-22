import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates `req[source]` against a Zod schema and replaces it with the
 * parsed (and type-coerced) result. Throws synchronously on failure —
 * Express 4 forwards synchronous errors from non-async middleware to the
 * centralized error handler automatically, which normalizes ZodError into
 * a 400 ValidationError response.
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req[source] = schema.parse(req[source]);
    next();
  };
}

export default validate;

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ApiError, ValidationError, ConflictError, NotFoundError, DatabaseError } from '@utils/ApiError';
import { isProduction } from '@config/env';
import { logger } from '@config/logger';

/**
 * Normalizes any thrown value into an ApiError so downstream handling
 * is uniform, regardless of whether it originated from our own code,
 * Zod, or Prisma.
 */
function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) {
    return err;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError('Validation failed', details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new ConflictError(
          `A record with this ${(err.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
        );
      case 'P2025':
        return new NotFoundError('Requested resource was not found');
      case 'P2003':
        return new ValidationError('Invalid reference to a related resource');
      default:
        return new DatabaseError(`Database error (${err.code})`);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data supplied to the database layer');
  }

  if (err instanceof MulterError) {
    return new ValidationError(`File upload error: ${err.message}`);
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return new ValidationError('Malformed JSON in request body');
  }

  if (err instanceof Error) {
    return new ApiError(500, isProduction ? 'Internal server error' : err.message, undefined, false);
  }

  return new ApiError(500, 'Internal server error', undefined, false);
}

/**
 * Express 4 identifies error-handling middleware purely by arity (4 args),
 * so this signature must be kept exactly as-is.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const apiError = normalizeError(err);

  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    statusCode: apiError.statusCode,
    requestId: req.headers['x-request-id'],
  };

  if (apiError.statusCode >= 500) {
    logger.error({ ...logPayload, err }, 'Unhandled server error');
  } else {
    logger.warn(logPayload, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors ?? [],
    ...(isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}

export default errorHandler;

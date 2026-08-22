import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '@utils/ApiError';

/**
 * Catches any request that didn't match a route and forwards a
 * consistent 404 ApiError to the centralized error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

export default notFoundHandler;

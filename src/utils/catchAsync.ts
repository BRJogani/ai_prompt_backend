import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express route/controller so rejected promises are
 * forwarded to `next()` and handled by the centralized error handler,
 * instead of crashing the process or requiring try/catch everywhere.
 */
export function catchAsync(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default catchAsync;

import { NextFunction, Request, Response } from 'express';

/**
 * Catches any request that didn't match a route and redirects directly to home.
 */
export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.redirect('/');
}

export default notFoundHandler;

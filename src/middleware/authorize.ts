import { NextFunction, Request, Response } from 'express';
import { AdminRole } from '@prisma/client';
import { AuthenticationError, AuthorizationError } from '@utils/ApiError';

/**
 * Restricts a route to one or more admin roles. Must run after
 * `authenticate` so `req.admin` is populated. SUPER_ADMIN always passes,
 * regardless of the roles listed, per Section 32 ("SUPER_ADMIN: Everything").
 */
export function authorize(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.admin.role === 'SUPER_ADMIN' || allowedRoles.includes(req.admin.role)) {
      next();
      return;
    }

    throw new AuthorizationError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
  };
}

export default authorize;

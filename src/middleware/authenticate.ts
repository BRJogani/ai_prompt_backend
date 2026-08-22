import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '@utils/jwt';
import { AuthenticationError } from '@utils/ApiError';
import { adminRepository } from '@repositories/admin.repository';
import { catchAsync } from '@utils/catchAsync';

/**
 * Verifies the `Authorization: Bearer <token>` header against the admin
 * access-token secret, then re-checks the admin record in the database
 * (rather than trusting the token payload alone) so a deactivated account
 * or a role change is honored immediately — admin traffic is low-volume,
 * so the extra query is a worthwhile trade for that safety property.
 */
export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token has expired');
    }
    throw new AuthenticationError('Invalid access token');
  }

  const admin = await adminRepository.findById(payload.sub);
  if (!admin || !admin.isActive) {
    throw new AuthenticationError('Admin account is inactive or no longer exists');
  }

  req.admin = { id: admin.id, email: admin.email, role: admin.role };
  next();
});

export default authenticate;

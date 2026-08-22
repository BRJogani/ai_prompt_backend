import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { AdminTokenPayload } from '../types/admin.types';

export function signAccessToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: AdminTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/** Throws jsonwebtoken's TokenExpiredError / JsonWebTokenError on failure — callers should catch. */
export function verifyAccessToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminTokenPayload;
}

/** Throws jsonwebtoken's TokenExpiredError / JsonWebTokenError on failure — callers should catch. */
export function verifyRefreshToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AdminTokenPayload;
}

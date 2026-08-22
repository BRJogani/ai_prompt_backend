import { createHash } from 'crypto';

/**
 * Hashes a refresh token before persisting it, so a database leak alone
 * can't be replayed as a valid session. Refresh tokens are high-entropy
 * signed JWTs (not human-chosen secrets), so a fast cryptographic hash is
 * appropriate here — unlike passwords, which require Argon2's deliberate
 * slowness.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

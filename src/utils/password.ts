import argon2 from 'argon2';

/**
 * Hashes a plaintext password with Argon2id (the OWASP-recommended variant,
 * resistant to both GPU-cracking and side-channel attacks).
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/**
 * Verifies a plaintext password against a stored Argon2 hash.
 * Never throws — a malformed hash or mismatched password both resolve to `false`.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Parses a short duration string ("15m", "30d", "1h", "60s") into
 * milliseconds. Used to compute a concrete `expiresAt` Date for refresh
 * tokens stored in the database, mirroring the JWT_REFRESH_EXPIRES_IN
 * string consumed by jsonwebtoken.
 */
export function parseDurationToMs(input: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${input}". Expected formats like "15m", "1h", "30d".`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit.toLowerCase()];
}

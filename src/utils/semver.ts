/**
 * Compares two dot-separated numeric version strings (e.g. "1.2.10" vs
 * "1.3.0"). Missing/non-numeric segments are treated as 0. No external
 * semver dependency needed for this simple three-part comparison.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseInt(n, 10) || 0);
  const partsB = b.split('.').map((n) => parseInt(n, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

export function isVersionLessThan(a: string, b: string): boolean {
  return compareVersions(a, b) < 0;
}

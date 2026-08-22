/**
 * Converts arbitrary text into a lowercase, hyphenated, URL-safe slug.
 * e.g. "Cinematic Luxury Portrait!" -> "cinematic-luxury-portrait"
 */
export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default slugify;

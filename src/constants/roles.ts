/**
 * Role groupings mirroring Section 32:
 *   CONTENT_ADMIN — categories, prompts, media, AI tools, tags (full control)
 *   EDITOR        — create/edit content (no delete/publish, enforced per-route below)
 * SUPER_ADMIN always passes through `authorize()` regardless of the list used.
 */
export const CONTENT_WRITE_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'] as const;
export const CONTENT_MANAGE_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN'] as const;
export const ANALYTICS_READ_ROLES = ['SUPER_ADMIN', 'ANALYTICS'] as const;

/** Dashboard, reports, and audit logs are read-heavy — open to ANALYTICS as well as content-management roles. */
export const DASHBOARD_READ_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'ANALYTICS'] as const;

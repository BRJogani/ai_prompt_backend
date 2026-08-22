import { AdminRole } from '@prisma/client';

/**
 * Coarse-grained resource permission map mirroring Section 32:
 *   SUPER_ADMIN   — everything
 *   CONTENT_ADMIN — categories, prompts, media, AI tools, tags
 *   EDITOR        — create/edit content only
 *   ANALYTICS     — read-only dashboard/analytics
 *
 * Route-level authorization currently uses the simpler `authorize(...roles)`
 * middleware directly (see middleware/authorize.ts). This map is provided
 * as the reference future modules can build finer-grained checks from via
 * `hasPermission()`, without needing another schema migration to add roles.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ['*'],
  CONTENT_ADMIN: ['categories:*', 'prompts:*', 'media:*', 'ai-tools:*', 'tags:*'],
  EDITOR: ['categories:write', 'prompts:write', 'media:write', 'ai-tools:write', 'tags:write'],
  ANALYTICS: ['analytics:read', 'dashboard:read'],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  if (role === 'SUPER_ADMIN') return true;

  const granted = ROLE_PERMISSIONS[role] ?? [];
  const [resource] = permission.split(':');
  return granted.includes(permission) || granted.includes(`${resource}:*`);
}

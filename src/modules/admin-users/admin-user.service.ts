import { AdminRole, AdminUser } from '@prisma/client';
import { adminRepository } from '@repositories/admin.repository';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

/** Public-safe admin shape — never includes passwordHash. Mirrors admin-auth.service's sanitizer. */
function sanitize(admin: AdminUser) {
  const { passwordHash: _passwordHash, ...rest } = admin;
  return rest;
}

export const adminUserService = {
  async list(params: { role?: AdminRole; page: number; limit: number }) {
    const { items, total } = await adminRepository.list(params);
    return { items: items.map(sanitize), total };
  },

  async getById(id: string) {
    const admin = await adminRepository.findById(id);
    if (!admin) throw new NotFoundError('Admin not found');
    return sanitize(admin);
  },

  async update(
    id: string,
    input: { name?: string; role?: AdminRole; isActive?: boolean },
    actingAdminId: string,
    ipAddress?: string,
  ) {
    const existing = await adminRepository.findById(id);
    if (!existing) throw new NotFoundError('Admin not found');

    // Guard against an admin locking themselves out or self-escalating/de-escalating.
    if (id === actingAdminId && input.isActive === false) {
      throw new ValidationError('You cannot deactivate your own account');
    }
    if (id === actingAdminId && input.role && input.role !== existing.role) {
      throw new ValidationError('You cannot change your own role');
    }

    const updated = await adminRepository.update(id, input);

    await recordAuditLog({
      adminId: actingAdminId,
      action: AUDIT_ACTIONS.UPDATE_ADMIN_USER,
      entityType: 'AdminUser',
      entityId: id,
      metadata: input,
      ipAddress,
    });

    return sanitize(updated);
  },

  async remove(id: string, actingAdminId: string, ipAddress?: string) {
    if (id === actingAdminId) {
      throw new ValidationError('You cannot delete your own account');
    }

    const existing = await adminRepository.findById(id);
    if (!existing) throw new NotFoundError('Admin not found');

    await adminRepository.delete(id);

    await recordAuditLog({
      adminId: actingAdminId,
      action: AUDIT_ACTIONS.DELETE_ADMIN_USER,
      entityType: 'AdminUser',
      entityId: id,
      ipAddress,
    });
  },
};

export default adminUserService;

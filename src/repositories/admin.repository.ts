import { prisma } from '@config/database';
import { AdminRole, Prisma } from '@prisma/client';

export const adminRepository = {
  findByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  },

  create(data: { email: string; passwordHash: string; name: string; role: AdminRole }) {
    return prisma.adminUser.create({ data });
  },

  updateLastLogin(id: string) {
    return prisma.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.adminUser.update({ where: { id }, data: { passwordHash } });
  },

  createRefreshToken(data: { adminId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.adminRefreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.adminRefreshToken.findUnique({ where: { tokenHash } });
  },

  revokeRefreshToken(id: string) {
    return prisma.adminRefreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllRefreshTokensForAdmin(adminId: string) {
    return prisma.adminRefreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Used by the Phase 9 admin-users management module (§32/§61's /admin/admin-users group). */
  async list(params: { role?: AdminRole; page: number; limit: number }) {
    const where: Prisma.AdminUserWhereInput = params.role ? { role: params.role } : {};

    const [items, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.adminUser.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, data: Prisma.AdminUserUpdateInput) {
    return prisma.adminUser.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.adminUser.delete({ where: { id } });
  },
};

export default adminRepository;

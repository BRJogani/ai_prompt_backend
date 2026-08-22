import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const auditLogRepository = {
  async list(params: { action?: string; entityType?: string; adminId?: string; page: number; limit: number }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.adminId ? { adminId: params.adminId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  },
};

export default auditLogRepository;

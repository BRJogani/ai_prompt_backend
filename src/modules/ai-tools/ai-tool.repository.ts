import { prisma } from '@config/database';
import { ActiveStatus, Prisma } from '@prisma/client';

export const aiToolRepository = {
  create(data: Prisma.AiToolCreateInput) {
    return prisma.aiTool.create({ data });
  },

  update(id: string, data: Prisma.AiToolUpdateInput) {
    return prisma.aiTool.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.aiTool.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.aiTool.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.aiTool.findUnique({ where: { slug } });
  },

  countPromptsUsingTool(id: string) {
    return prisma.prompt.count({
      where: {
        aiToolId: id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
  },

  async list(params: { status?: ActiveStatus; page: number; limit: number }) {
    const where: Prisma.AiToolWhereInput = params.status ? { status: params.status } : {};

    const [items, total] = await Promise.all([
      prisma.aiTool.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.aiTool.count({ where }),
    ]);

    return { items, total };
  },

  listAllActive() {
    return prisma.aiTool.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } });
  },
};

export default aiToolRepository;

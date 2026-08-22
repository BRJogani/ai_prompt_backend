import { prisma } from '@config/database';
import { ActiveStatus, Prisma } from '@prisma/client';

export const categoryRepository = {
  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },

  countPromptsInCategory(id: string) {
    return prisma.prompt.count({
      where: {
        categoryId: id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
  },

  async list(params: { status?: ActiveStatus; isFeatured?: boolean; page: number; limit: number }) {
    const where: Prisma.CategoryWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.isFeatured !== undefined ? { isFeatured: params.isFeatured } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.category.count({ where }),
    ]);

    return { items, total };
  },

  listAllActive() {
    return prisma.category.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } });
  },
};

export default categoryRepository;

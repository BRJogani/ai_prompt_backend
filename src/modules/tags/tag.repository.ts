import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const tagRepository = {
  create(data: Prisma.TagCreateInput) {
    return prisma.tag.create({ data });
  },

  update(id: string, data: Prisma.TagUpdateInput) {
    return prisma.tag.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.tag.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.tag.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.tag.findUnique({ where: { slug } });
  },

  async list(params: { search?: string; page: number; limit: number }) {
    const where: Prisma.TagWhereInput = params.search
      ? { name: { contains: params.search, mode: 'insensitive' } }
      : {};

    const [items, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.tag.count({ where }),
    ]);

    return { items, total };
  },

  listAll() {
    return prisma.tag.findMany({ orderBy: { name: 'asc' } });
  },

  findManyByIds(ids: string[]) {
    return prisma.tag.findMany({ where: { id: { in: ids } } });
  },
};

export default tagRepository;

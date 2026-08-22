import { prisma } from '@config/database';

const promptCardInclude = {
  category: true,
  aiTool: true,
  media: { orderBy: { sortOrder: 'asc' as const } },
};

export const favoriteRepository = {
  find(userId: string, promptId: string) {
    return prisma.favorite.findUnique({ where: { userId_promptId: { userId, promptId } } });
  },

  create(userId: string, promptId: string) {
    return prisma.favorite.create({ data: { userId, promptId } });
  },

  delete(userId: string, promptId: string) {
    return prisma.favorite.delete({ where: { userId_promptId: { userId, promptId } } });
  },

  async list(userId: string, page: number, limit: number) {
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        include: { prompt: { include: promptCardInclude } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.favorite.count({ where }),
    ]);
    return { items, total };
  },
};

export default favoriteRepository;

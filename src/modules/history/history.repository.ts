import { prisma } from '@config/database';

const promptCardInclude = {
  category: true,
  aiTool: true,
  media: { orderBy: { sortOrder: 'asc' as const } },
};

export const historyRepository = {
  /** One row per (user, prompt) — re-viewing updates viewedAt instead of creating duplicates (Section 12). */
  upsert(userId: string, promptId: string) {
    return prisma.history.upsert({
      where: { userId_promptId: { userId, promptId } },
      update: { viewedAt: new Date() },
      create: { userId, promptId },
    });
  },

  async list(userId: string, page: number, limit: number) {
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.history.findMany({
        where,
        include: { prompt: { include: promptCardInclude } },
        orderBy: { viewedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.history.count({ where }),
    ]);
    return { items, total };
  },

  clearAll(userId: string) {
    return prisma.history.deleteMany({ where: { userId } });
  },

  clearOne(userId: string, promptId: string) {
    return prisma.history.deleteMany({ where: { userId, promptId } });
  },
};

export default historyRepository;

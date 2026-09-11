import { prisma } from '@config/database';
import { ContentType, Prisma, PromptStatus } from '@prisma/client';
import { getDailyOrderedPromptIds, clearDailyShuffleCache } from './daily-shuffle.service';
import { appSettingService } from '@modules/app-config/app-setting.service';

/** Standard include shape for admin-facing prompt reads. */
const adminInclude = {
  category: true,
  aiTool: true,
  media: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
};

export type PromptSortOption = 'latest' | 'trending' | 'popular' | 'most_viewed' | 'most_favorited' | 'most_copied' | 'daily_shuffle';

/**
 * Maps each public sort option (Section 31) to a Prisma orderBy clause.
 * `trending` uses the stored, time-decayed `trendingScore` (recalculated
 * by a background job in Phase 6) rather than raw view count, per Section 14.
 */
function resolveOrderBy(sort: PromptSortOption): Prisma.PromptOrderByWithRelationInput[] {
  switch (sort) {
    case 'trending':
      return [{ trendingScore: 'desc' }, { publishedAt: 'desc' }];
    case 'popular':
    case 'most_viewed':
      return [{ viewCount: 'desc' }, { publishedAt: 'desc' }];
    case 'most_favorited':
      return [{ favoriteCount: 'desc' }, { publishedAt: 'desc' }];
    case 'most_copied':
      return [{ copyCount: 'desc' }, { publishedAt: 'desc' }];
    case 'latest':
    default:
      return [{ publishedAt: 'desc' }];
  }
}

export const promptRepository = {
  create(data: Prisma.PromptCreateInput) {
    clearDailyShuffleCache();
    return prisma.prompt.create({ data, include: adminInclude });
  },

  update(id: string, data: Prisma.PromptUpdateInput) {
    clearDailyShuffleCache();
    return prisma.prompt.update({ where: { id }, data, include: adminInclude });
  },

  delete(id: string) {
    clearDailyShuffleCache();
    return prisma.prompt.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.prompt.findUnique({ where: { id }, include: adminInclude });
  },

  findBySlug(slug: string) {
    return prisma.prompt.findUnique({ where: { slug } });
  },

  addTags(promptId: string, tagIds: string[]) {
    return prisma.promptTag.createMany({
      data: tagIds.map((tagId) => ({ promptId, tagId })),
    });
  },

  removeTag(promptId: string, tagId: string) {
    return prisma.promptTag.deleteMany({ where: { promptId, tagId } });
  },

  replaceTags(promptId: string, tagIds: string[]) {
    return prisma.$transaction([
      prisma.promptTag.deleteMany({ where: { promptId } }),
      prisma.promptTag.createMany({ data: tagIds.map((tagId) => ({ promptId, tagId })) }),
    ]);
  },

  async list(params: {
    status?: PromptStatus;
    categoryId?: string;
    aiToolId?: string;
    contentType?: ContentType;
    isFeatured?: boolean;
    isTrending?: boolean;
    isPremium?: boolean;
    search?: string;
    page: number;
    limit: number;
  }) {
    const notDeletedFilter: Prisma.PromptWhereInput = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    };

    const where: Prisma.PromptWhereInput = {
      AND: [
        notDeletedFilter,
        ...(params.status ? [{ status: params.status }] : []),
        ...(params.categoryId ? [{ categoryId: params.categoryId }] : []),
        ...(params.aiToolId ? [{ aiToolId: params.aiToolId }] : []),
        ...(params.contentType ? [{ contentType: params.contentType }] : []),
        ...(params.isFeatured !== undefined ? [{ isFeatured: params.isFeatured }] : []),
        ...(params.isTrending !== undefined ? [{ isTrending: params.isTrending }] : []),
        ...(params.isPremium !== undefined ? [{ isPremium: params.isPremium }] : []),
        ...(params.search
          ? [
              {
                OR: [
                  { title: { contains: params.search, mode: 'insensitive' as const } },
                  { description: { contains: params.search, mode: 'insensitive' as const } },
                  { promptText: { contains: params.search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: adminInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.prompt.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Published, non-deleted prompts for every public-facing read: category
   * detail, general browsing, the dedicated trending/popular/latest
   * endpoints (Section 14), and search (Section 29). All of those are this
   * one query with a different `sort`/filter combination — not five+
   * separate implementations.
   */
  async findPublic(params: {
    page: number;
    limit: number;
    categoryId?: string;
    aiToolId?: string;
    contentType?: ContentType;
    isFeatured?: boolean;
    isPremium?: boolean;
    sort?: PromptSortOption;
    search?: string;
    /** Merged in via AND — used by the video-visibility gate (Sections 16-18). */
    extraWhere?: Prisma.PromptWhereInput;
  }) {
    const notDeletedFilter: Prisma.PromptWhereInput = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    };

    const baseWhere: Prisma.PromptWhereInput = {
      AND: [
        notDeletedFilter,
        { status: 'PUBLISHED' },
        ...(params.categoryId ? [{ categoryId: params.categoryId }] : []),
        ...(params.aiToolId ? [{ aiToolId: params.aiToolId }] : []),
        ...(params.contentType ? [{ contentType: params.contentType }] : []),
        ...(params.isFeatured !== undefined ? [{ isFeatured: params.isFeatured }] : []),
        ...(params.isPremium !== undefined ? [{ isPremium: params.isPremium }] : []),
        ...(params.search
          ? [
              {
                OR: [
                  { title: { contains: params.search, mode: 'insensitive' as const } },
                  { description: { contains: params.search, mode: 'insensitive' as const } },
                  { promptText: { contains: params.search, mode: 'insensitive' as const } },
                  { tags: { some: { tag: { name: { contains: params.search, mode: 'insensitive' as const } } } } },
                ],
              },
            ]
          : []),
      ],
    };

    const where: Prisma.PromptWhereInput = params.extraWhere ? { AND: [baseWhere, params.extraWhere] } : baseWhere;

    // Check if daily synchronized shuffle should be applied
    const isExplicitShuffle = params.sort === 'daily_shuffle';
    let shouldUseDailyShuffle = isExplicitShuffle;
    if (!shouldUseDailyShuffle && (!params.sort || params.sort === 'latest') && !params.search) {
      shouldUseDailyShuffle = await appSettingService.getBoolean('daily_shuffle_enabled', true);
    }

    if (shouldUseDailyShuffle) {
      const allOrderedIds = await getDailyOrderedPromptIds(where);
      const total = allOrderedIds.length;
      const skip = (params.page - 1) * params.limit;
      const pageIds = allOrderedIds.slice(skip, skip + params.limit);

      if (pageIds.length === 0) {
        return { items: [], total };
      }

      const rawItems = await prisma.prompt.findMany({
        where: { id: { in: pageIds } },
        include: adminInclude,
      });

      // Re-order raw items to strictly match the daily deterministic pageIds order
      const itemMap = new Map(rawItems.map((item) => [item.id, item]));
      const items = pageIds.map((id) => itemMap.get(id)).filter(Boolean) as typeof rawItems;

      return { items, total };
    }

    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: adminInclude,
        orderBy: resolveOrderBy(params.sort ?? 'latest'),
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.prompt.count({ where }),
    ]);

    return { items, total };
  },

  /** Single published prompt for the public detail page — 404s (returns null) for drafts/archived/deleted. */
  findPublicById(id: string, extraWhere?: Prisma.PromptWhereInput) {
    const notDeletedFilter: Prisma.PromptWhereInput = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    };
    const baseWhere: Prisma.PromptWhereInput = {
      id,
      status: 'PUBLISHED',
      AND: [notDeletedFilter],
    };
    const where = extraWhere ? { AND: [baseWhere, extraWhere] } : baseWhere;
    return prisma.prompt.findFirst({ where, include: adminInclude });
  },

  /** Increments the denormalized favorite counter used for "most_favorited" sorting. */
  incrementFavoriteCount(id: string) {
    return prisma.prompt.update({ where: { id }, data: { favoriteCount: { increment: 1 } } });
  },

  decrementFavoriteCount(id: string) {
    return prisma.prompt.update({ where: { id }, data: { favoriteCount: { decrement: 1 } } });
  },

  /** Bumped from analytics event ingestion (Phase 6) — PROMPT_VIEW/PROMPT_COPY/PROMPT_SHARE. */
  incrementViewCount(id: string) {
    return prisma.prompt.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  },

  incrementCopyCount(id: string) {
    return prisma.prompt.update({ where: { id }, data: { copyCount: { increment: 1 } } });
  },

  incrementShareCount(id: string) {
    return prisma.prompt.update({ where: { id }, data: { shareCount: { increment: 1 } } });
  },

  async existsById(id: string): Promise<boolean> {
    const prompt = await prisma.prompt.findUnique({ where: { id }, select: { id: true } });
    return prompt !== null;
  },
};

export default promptRepository;

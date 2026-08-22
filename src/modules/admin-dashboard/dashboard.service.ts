import { prisma } from '@config/database';
import { AnalyticsEventType } from '@prisma/client';

type DateRange = 'today' | 'yesterday' | '7d' | '30d';

function resolveRange(range: DateRange, from?: string, to?: string): { start: Date; end: Date } {
  if (from && to) return { start: new Date(from), end: new Date(to) };

  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
    default:
      start.setDate(start.getDate() - 30);
      break;
  }

  return { start, end };
}

export const dashboardService = {
  async getOverview() {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };

    const [
      totalUsers,
      activeToday,
      active7d,
      active30d,
      totalPrompts,
      totalCategories,
      totalFavorites,
      pendingReports,
      contentTypeCounts,
      eventTypeCounts,
      promptAggregates,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: resolveRange('today').start } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: resolveRange('7d').start } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: resolveRange('30d').start } } }),
      prisma.prompt.count({ where: notDeletedFilter }),
      prisma.category.count(),
      prisma.favorite.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.prompt.groupBy({
        by: ['contentType'],
        where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
        _count: true,
      }),
      prisma.analyticsEvent.groupBy({ by: ['eventType'], _count: true }),
      prisma.prompt.aggregate({
        where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
        _sum: { viewCount: true, copyCount: true, shareCount: true },
      }),
    ]);

    const videoCount = contentTypeCounts.find((c) => c.contentType === 'VIDEO')?._count ?? 0;
    const imageCount = contentTypeCounts.find((c) => c.contentType === 'IMAGE')?._count ?? 0;
    const bothCount = contentTypeCounts.find((c) => c.contentType === 'BOTH')?._count ?? 0;

    const eventCounts: Partial<Record<AnalyticsEventType, number>> = {};
    for (const row of eventTypeCounts) {
      eventCounts[row.eventType] = row._count;
    }

    return {
      users: { total: totalUsers, activeToday, active7d, active30d },
      content: {
        totalPrompts,
        totalCategories,
        // A BOTH-type prompt counts toward both totals since it genuinely has both.
        totalImages: imageCount + bothCount,
        totalVideos: videoCount + bothCount,
      },
      engagement: {
        totalViews: promptAggregates._sum.viewCount ?? 0,
        totalCopies: promptAggregates._sum.copyCount ?? 0,
        totalShares: promptAggregates._sum.shareCount ?? 0,
        totalFavorites,
      },
      eventCounts,
      pendingReports,
    };
  },

  async getTopPrompts(metric: 'viewCount' | 'copyCount' | 'favoriteCount', limit: number) {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    return prisma.prompt.findMany({
      where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
      orderBy: { [metric]: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        categoryId: true,
        viewCount: true,
        copyCount: true,
        favoriteCount: true,
        shareCount: true,
      },
    });
  },

  async getTopCategories(limit: number) {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    const grouped = await prisma.prompt.groupBy({
      by: ['categoryId'],
      where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
      _sum: { viewCount: true },
      _count: true,
      orderBy: { _sum: { viewCount: 'desc' } },
      take: limit,
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      category: byId.get(g.categoryId) ?? null,
      promptCount: g._count,
      totalViews: g._sum.viewCount ?? 0,
    }));
  },

  /**
   * Daily event-count buckets for admin dashboard charts (Section 33's
   * "Charts" requirement — the aggregation lives here, actual chart
   * rendering is the admin frontend's job). Bucketed in JS rather than a
   * raw SQL date_trunc to stay portable and avoid a raw-query dependency
   * for what's an admin-only, moderate-volume read.
   */
  async getEventsTimeseries(eventType: AnalyticsEventType | undefined, range: DateRange, from?: string, to?: string) {
    const { start, end } = resolveRange(range, from, to);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(eventType ? { eventType } : {}),
      },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (const event of events) {
      const day = event.createdAt.toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }

    return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
  },
};

export default dashboardService;

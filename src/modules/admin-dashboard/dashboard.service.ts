import { prisma } from '@config/database';
import { AnalyticsEventType } from '@prisma/client';
import { DashboardRange } from '@validators/dashboard.validator';

export function resolveRange(
  range: DashboardRange = 'today',
  from?: string,
  to?: string,
): { start: Date; end: Date; isAllTime: boolean } {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if ((range === 'custom' || (!range && from && to)) && from && to) {
    const customStart = new Date(from);
    if (!isNaN(customStart.getTime())) {
      customStart.setHours(0, 0, 0, 0);
      const customEnd = new Date(to);
      if (!isNaN(customEnd.getTime())) {
        customEnd.setHours(23, 59, 59, 999);
        return { start: customStart, end: customEnd, isAllTime: false };
      }
    }
  }

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
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'all_time':
      return { start: new Date(0), end, isAllTime: true };
    default:
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end, isAllTime: false };
}

export const dashboardService = {
  async getOverview(range: DashboardRange = 'today', from?: string, to?: string) {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    const { start, end, isAllTime } = resolveRange(range, from, to);
    const eventDateFilter = isAllTime ? {} : { createdAt: { gte: start, lte: end } };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeToday,
      activeYesterday,
      active7d,
      active30d,
      totalPrompts,
      publishedPrompts,
      createdInPeriod,
      totalCategories,
      totalFavorites,
      pendingReports,
      contentTypeCounts,
      eventTypeCounts,
      promptAggregates,
      periodEventsGrouped,
      distinctPeriodUsers,
      distinctPeriodViewers,
      distinctPeriodCopiers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: todayStart } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
      prisma.prompt.count({ where: notDeletedFilter }),
      prisma.prompt.count({ where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] } }),
      isAllTime
        ? prisma.prompt.count({ where: notDeletedFilter })
        : prisma.prompt.count({ where: { AND: [notDeletedFilter, { createdAt: { gte: start, lte: end } }] } }),
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
        _sum: { viewCount: true, copyCount: true, shareCount: true, favoriteCount: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: eventDateFilter,
        _count: true,
      }),
      // Active users in selected period
      prisma.analyticsEvent.findMany({
        where: { ...eventDateFilter, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      // Unique prompt viewers in period
      prisma.analyticsEvent.findMany({
        where: { eventType: 'PROMPT_VIEW', ...eventDateFilter, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      // Unique prompt copiers in period
      prisma.analyticsEvent.findMany({
        where: { eventType: 'PROMPT_COPY', ...eventDateFilter, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    const videoCount = contentTypeCounts.find((c) => c.contentType === 'VIDEO')?._count ?? 0;
    const imageCount = contentTypeCounts.find((c) => c.contentType === 'IMAGE')?._count ?? 0;
    const bothCount = contentTypeCounts.find((c) => c.contentType === 'BOTH')?._count ?? 0;

    // Period specific counts
    const periodEventCounts: Partial<Record<AnalyticsEventType, number>> = {};
    for (const row of periodEventsGrouped) {
      periodEventCounts[row.eventType] = row._count;
    }

    const allTimeEventCounts: Partial<Record<AnalyticsEventType, number>> = {};
    for (const row of eventTypeCounts) {
      allTimeEventCounts[row.eventType] = row._count;
    }

    const periodViews = periodEventCounts['PROMPT_VIEW'] ?? 0;
    const periodCopies = periodEventCounts['PROMPT_COPY'] ?? 0;
    const periodShares = periodEventCounts['PROMPT_SHARE'] ?? 0;
    const periodFavorites = periodEventCounts['PROMPT_FAVORITE'] ?? 0;

    const totalViews = isAllTime ? Math.max(promptAggregates._sum.viewCount ?? 0, periodViews) : periodViews;
    const totalCopies = isAllTime ? Math.max(promptAggregates._sum.copyCount ?? 0, periodCopies) : periodCopies;
    const totalShares = isAllTime ? Math.max(promptAggregates._sum.shareCount ?? 0, periodShares) : periodShares;
    const totalFaves = isAllTime ? Math.max(promptAggregates._sum.favoriteCount ?? totalFavorites, periodFavorites) : periodFavorites;

    // Active users in filter window
    let activeInPeriod = distinctPeriodUsers.length;
    if (range === 'today' && activeInPeriod === 0) {
      activeInPeriod = activeToday;
    } else if (range === 'yesterday' && activeInPeriod === 0) {
      activeInPeriod = activeYesterday;
    } else if (range === '7d' && activeInPeriod === 0) {
      activeInPeriod = active7d;
    } else if ((range === '30d' || range === 'this_month') && activeInPeriod === 0) {
      activeInPeriod = active30d;
    } else if (isAllTime) {
      activeInPeriod = totalUsers;
    }

    // Calculate DAU growth rate vs yesterday
    let dauTrendPercent = 0;
    if (activeYesterday > 0) {
      dauTrendPercent = Math.round(((activeToday - activeYesterday) / activeYesterday) * 100);
    } else if (activeToday > 0) {
      dauTrendPercent = 100;
    }

    const uniqueViewersCount = distinctPeriodViewers.length;
    const uniqueCopiersCount = distinctPeriodCopiers.length;

    // Copy-through conversion rate
    const copyConversionRate =
      uniqueViewersCount > 0
        ? `${Math.min(100, Math.round((uniqueCopiersCount / uniqueViewersCount) * 100))}%`
        : totalViews > 0
        ? `${Math.min(100, Math.round((totalCopies / totalViews) * 100))}%`
        : '0%';

    return {
      users: {
        total: totalUsers,
        activeInPeriod,
        activeToday,
        activeYesterday,
        active7d,
        active30d,
        dauTrendPercent,
      },
      content: {
        totalPrompts,
        publishedPrompts,
        createdInPeriod,
        draftPrompts: Math.max(0, totalPrompts - publishedPrompts),
        totalCategories,
        totalImages: imageCount + bothCount,
        totalVideos: videoCount + bothCount,
      },
      engagement: {
        totalViews,
        totalCopies,
        totalShares,
        totalFavorites: totalFaves,
        uniqueViewers: uniqueViewersCount,
        uniqueCopiers: uniqueCopiersCount,
        copyConversionRate,
      },
      exploration: {
        totalCategoryViews: periodEventCounts['CATEGORY_VIEW'] ?? 0,
        totalPromptViews: periodViews,
        totalPromptCopies: periodCopies,
        totalSearches: periodEventCounts['SEARCH'] ?? 0,
      },
      eventCounts: periodEventCounts,
      allTimeEventCounts,
      pendingReports,
      filterInfo: {
        range,
        start: start.toISOString(),
        end: end.toISOString(),
        isAllTime,
      },
    };
  },

  async getTopPrompts(
    metric: 'viewCount' | 'copyCount' | 'favoriteCount' | 'shareCount' | 'trendingScore' = 'viewCount',
    limit = 10,
    range: DashboardRange = 'today',
    from?: string,
    to?: string,
  ) {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    const { start, end, isAllTime } = resolveRange(range, from, to);
    const eventDateFilter = isAllTime ? {} : { createdAt: { gte: start, lte: end } };

    // If filtering by a period other than all-time, aggregate events in that period
    let periodPromptScores: Map<string, { views: number; copies: number; favorites: number; shares: number; uniqueViewers: Set<string>; uniqueCopiers: Set<string> }> = new Map();

    if (!isAllTime) {
      const periodEvents = await prisma.analyticsEvent.findMany({
        where: {
          ...eventDateFilter,
          promptId: { not: null },
          eventType: { in: ['PROMPT_VIEW', 'PROMPT_COPY', 'PROMPT_FAVORITE', 'PROMPT_SHARE'] },
        },
        select: {
          promptId: true,
          eventType: true,
          userId: true,
        },
      });

      for (const ev of periodEvents) {
        const pid = ev.promptId;
        if (!pid) continue;
        if (!periodPromptScores.has(pid)) {
          periodPromptScores.set(pid, {
            views: 0,
            copies: 0,
            favorites: 0,
            shares: 0,
            uniqueViewers: new Set(),
            uniqueCopiers: new Set(),
          });
        }
        const score = periodPromptScores.get(pid)!;
        if (ev.eventType === 'PROMPT_VIEW') {
          score.views++;
          if (ev.userId) score.uniqueViewers.add(ev.userId);
        } else if (ev.eventType === 'PROMPT_COPY') {
          score.copies++;
          if (ev.userId) score.uniqueCopiers.add(ev.userId);
        } else if (ev.eventType === 'PROMPT_FAVORITE') {
          score.favorites++;
        } else if (ev.eventType === 'PROMPT_SHARE') {
          score.shares++;
        }
      }
    }

    // Sort prompt IDs based on the requested metric in this period
    let targetPromptIds: string[] = [];
    if (!isAllTime && periodPromptScores.size > 0) {
      const entries = Array.from(periodPromptScores.entries());
      entries.sort(([, a], [, b]) => {
        if (metric === 'copyCount') return b.copies - a.copies || b.views - a.views;
        if (metric === 'favoriteCount') return b.favorites - a.favorites || b.views - a.views;
        if (metric === 'shareCount') return b.shares - a.shares || b.views - a.views;
        if (metric === 'trendingScore') {
          const scoreB = b.views + b.favorites * 3 + b.copies * 2 + b.shares * 5;
          const scoreA = a.views + a.favorites * 3 + a.copies * 2 + a.shares * 5;
          return scoreB - scoreA;
        }
        return b.views - a.views || b.copies - a.copies;
      });
      targetPromptIds = entries.map(([id]) => id).slice(0, limit);
    }

    let prompts: any[] = [];
    if (targetPromptIds.length > 0) {
      prompts = await prisma.prompt.findMany({
        where: { id: { in: targetPromptIds }, AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
        select: {
          id: true,
          title: true,
          slug: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
          media: {
            select: { id: true, mediaType: true, secureUrl: true, thumbnailUrl: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          viewCount: true,
          copyCount: true,
          favoriteCount: true,
          shareCount: true,
          trendingScore: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      // Maintain period sort order
      const promptMap = new Map(prompts.map((p) => [p.id, p]));
      prompts = targetPromptIds.map((id) => promptMap.get(id)).filter(Boolean);
    }

    // Backfill with all-time top prompts if period has fewer entries
    if (prompts.length < limit) {
      const existingIds = new Set(prompts.map((p) => p.id));
      const backfill = await prisma.prompt.findMany({
        where: {
          AND: [
            notDeletedFilter,
            { status: 'PUBLISHED' },
            existingIds.size > 0 ? { id: { notIn: Array.from(existingIds) } } : {},
          ],
        },
        orderBy: { [metric]: 'desc' },
        take: limit - prompts.length,
        select: {
          id: true,
          title: true,
          slug: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
          media: {
            select: { id: true, mediaType: true, secureUrl: true, thumbnailUrl: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          viewCount: true,
          copyCount: true,
          favoriteCount: true,
          shareCount: true,
          trendingScore: true,
          publishedAt: true,
          createdAt: true,
        },
      });
      prompts = [...prompts, ...backfill];
    }

    if (prompts.length === 0) return [];

    // Compute unique viewers and copiers for all-time mode if needed
    if (isAllTime) {
      const promptIds = prompts.map((p) => p.id);
      const events = await prisma.analyticsEvent.findMany({
        where: {
          promptId: { in: promptIds },
          eventType: { in: ['PROMPT_VIEW', 'PROMPT_COPY'] },
        },
        select: {
          promptId: true,
          eventType: true,
          userId: true,
        },
      });

      const viewersMap = new Map<string, Set<string>>();
      const copiersMap = new Map<string, Set<string>>();

      for (const ev of events) {
        const pid = ev.promptId;
        if (!pid || !ev.userId) continue;
        if (ev.eventType === 'PROMPT_VIEW') {
          if (!viewersMap.has(pid)) viewersMap.set(pid, new Set());
          viewersMap.get(pid)!.add(ev.userId);
        } else if (ev.eventType === 'PROMPT_COPY') {
          if (!copiersMap.has(pid)) copiersMap.set(pid, new Set());
          copiersMap.get(pid)!.add(ev.userId);
        }
      }

      return prompts.map((p) => {
        const uniqueViewers = viewersMap.get(p.id)?.size ?? p.viewCount;
        const uniqueCopiers = copiersMap.get(p.id)?.size ?? p.copyCount;
        const copyConversionRate =
          uniqueViewers > 0
            ? `${Math.min(100, Math.round((uniqueCopiers / uniqueViewers) * 100))}%`
            : p.viewCount > 0
            ? `${Math.min(100, Math.round((p.copyCount / p.viewCount) * 100))}%`
            : '0%';

        return {
          ...p,
          periodViews: p.viewCount,
          periodCopies: p.copyCount,
          uniqueViewers,
          uniqueCopiers,
          copyConversionRate,
        };
      });
    }

    return prompts.map((p) => {
      const periodScore = periodPromptScores.get(p.id);
      const pViews = periodScore?.views ?? 0;
      const pCopies = periodScore?.copies ?? 0;
      const uniqueViewers = periodScore?.uniqueViewers.size ?? 0;
      const uniqueCopiers = periodScore?.uniqueCopiers.size ?? 0;
      const copyConversionRate =
        uniqueViewers > 0
          ? `${Math.min(100, Math.round((uniqueCopiers / uniqueViewers) * 100))}%`
          : pViews > 0
          ? `${Math.min(100, Math.round((pCopies / pViews) * 100))}%`
          : '0%';

      return {
        ...p,
        periodViews: pViews,
        periodCopies: pCopies,
        uniqueViewers,
        uniqueCopiers,
        copyConversionRate,
      };
    });
  },

  async getTopCategories(limit = 10, range: DashboardRange = 'today', from?: string, to?: string) {
    const notDeletedFilter = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
    const { start, end, isAllTime } = resolveRange(range, from, to);
    const eventDateFilter = isAllTime ? {} : { createdAt: { gte: start, lte: end } };

    const [allCategories, promptGroups, categoryViewEvents, periodPromptViewEvents] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          iconUrl: true,
          coverImageUrl: true,
          status: true,
          sortOrder: true,
        },
      }),
      prisma.prompt.groupBy({
        by: ['categoryId'],
        where: { AND: [notDeletedFilter, { status: 'PUBLISHED' }] },
        _count: true,
        _sum: {
          viewCount: true,
          copyCount: true,
          favoriteCount: true,
          shareCount: true,
        },
      }),
      prisma.analyticsEvent.findMany({
        where: { eventType: 'CATEGORY_VIEW', categoryId: { not: null }, ...eventDateFilter },
        select: { categoryId: true, userId: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { eventType: 'PROMPT_VIEW', categoryId: { not: null }, ...eventDateFilter },
        select: { categoryId: true },
      }),
    ]);

    const promptMap = new Map(promptGroups.map((g) => [g.categoryId, g]));

    const explorationCounts = new Map<string, number>();
    const uniqueExplorers = new Map<string, Set<string>>();
    for (const ev of categoryViewEvents) {
      const cid = ev.categoryId;
      if (!cid) continue;
      explorationCounts.set(cid, (explorationCounts.get(cid) ?? 0) + 1);
      if (ev.userId) {
        if (!uniqueExplorers.has(cid)) uniqueExplorers.set(cid, new Set());
        uniqueExplorers.get(cid)!.add(ev.userId);
      }
    }

    const periodPromptViewsMap = new Map<string, number>();
    for (const ev of periodPromptViewEvents) {
      const cid = ev.categoryId;
      if (!cid) continue;
      periodPromptViewsMap.set(cid, (periodPromptViewsMap.get(cid) ?? 0) + 1);
    }

    const result = allCategories.map((c) => {
      const pStats = promptMap.get(c.id);
      const totalViews = isAllTime ? (pStats?._sum.viewCount ?? 0) : (periodPromptViewsMap.get(c.id) ?? 0);
      const totalCopies = pStats?._sum.copyCount ?? 0;
      const totalFavorites = pStats?._sum.favoriteCount ?? 0;
      const totalShares = pStats?._sum.shareCount ?? 0;
      const promptCount = pStats?._count ?? 0;
      const explorationCount = explorationCounts.get(c.id) ?? 0;
      const explorers = uniqueExplorers.get(c.id)?.size ?? 0;

      return {
        category: c,
        promptCount,
        totalViews,
        totalCopies,
        totalFavorites,
        totalShares,
        explorationCount,
        uniqueExplorers: explorers,
      };
    });

    result.sort((a, b) => {
      if (!isAllTime) {
        return b.explorationCount - a.explorationCount || b.totalViews - a.totalViews || b.promptCount - a.promptCount;
      }
      return b.totalViews - a.totalViews || b.explorationCount - a.explorationCount;
    });

    return result.slice(0, limit);
  },

  async getEngagementAnalytics(range: DashboardRange = 'today', from?: string, to?: string) {
    const [categoriesResult, topPromptsResult, overview] = await Promise.all([
      this.getTopCategories(100, range, from, to),
      this.getTopPrompts('viewCount', 50, range, from, to),
      this.getOverview(range, from, to),
    ]);

    return {
      dauMetrics: overview.users,
      categoryExplorations: categoriesResult,
      promptEngagement: topPromptsResult,
      filterInfo: overview.filterInfo,
    };
  },

  async getEventsTimeseries(
    eventType: AnalyticsEventType | undefined,
    range: DashboardRange = 'today',
    from?: string,
    to?: string,
  ) {
    const { start, end, isAllTime } = resolveRange(range, from, to);
    const eventDateFilter = isAllTime ? {} : { createdAt: { gte: start, lte: end } };

    const events = await prisma.analyticsEvent.findMany({
      where: {
        ...eventDateFilter,
        ...(eventType ? { eventType } : {}),
      },
      select: { createdAt: true },
    });

    // For single-day ranges (today/yesterday), bucket by hour (00:00 - 23:00)
    if (range === 'today' || range === 'yesterday') {
      const buckets = new Map<string, number>();
      for (let h = 0; h < 24; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        buckets.set(hourStr, 0);
      }
      for (const event of events) {
        const hour = `${event.createdAt.getHours().toString().padStart(2, '0')}:00`;
        buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
      }
      return [...buckets.entries()].map(([date, count]) => ({ date, count }));
    }

    // For 7 days, pre-populate all 7 days
    if (range === '7d') {
      const buckets = new Map<string, number>();
      for (let d = 6; d >= 0; d--) {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - d);
        const dayStr = dayDate.toISOString().slice(0, 10);
        buckets.set(dayStr, 0);
      }
      for (const event of events) {
        const day = event.createdAt.toISOString().slice(0, 10);
        if (buckets.has(day)) {
          buckets.set(day, buckets.get(day)! + 1);
        } else {
          buckets.set(day, (buckets.get(day) ?? 0) + 1);
        }
      }
      return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
    }

    const buckets = new Map<string, number>();
    for (const event of events) {
      const day = event.createdAt.toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }

    return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
  },

  async getDauTimeseries(range: DashboardRange = 'today', from?: string, to?: string) {
    const { start, end, isAllTime } = resolveRange(range, from, to);
    const eventDateFilter = isAllTime ? {} : { createdAt: { gte: start, lte: end } };

    const events = await prisma.analyticsEvent.findMany({
      where: { ...eventDateFilter, userId: { not: null } },
      select: { createdAt: true, userId: true },
    });

    // Hourly DAU for today or yesterday
    if (range === 'today' || range === 'yesterday') {
      const hourlyUsers = new Map<string, Set<string>>();
      for (let h = 0; h < 24; h++) {
        hourlyUsers.set(`${h.toString().padStart(2, '0')}:00`, new Set());
      }
      for (const ev of events) {
        if (!ev.userId) continue;
        const hour = `${ev.createdAt.getHours().toString().padStart(2, '0')}:00`;
        if (!hourlyUsers.has(hour)) hourlyUsers.set(hour, new Set());
        hourlyUsers.get(hour)!.add(ev.userId);
      }
      return [...hourlyUsers.entries()].map(([date, set]) => ({ date, count: set.size }));
    }

    // For 7 days, pre-populate all 7 days
    if (range === '7d') {
      const dailyUsers = new Map<string, Set<string>>();
      for (let d = 6; d >= 0; d--) {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - d);
        const dayStr = dayDate.toISOString().slice(0, 10);
        dailyUsers.set(dayStr, new Set());
      }
      for (const ev of events) {
        if (!ev.userId) continue;
        const day = ev.createdAt.toISOString().slice(0, 10);
        if (!dailyUsers.has(day)) dailyUsers.set(day, new Set());
        dailyUsers.get(day)!.add(ev.userId);
      }
      return [...dailyUsers.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, set]) => ({ date, count: set.size }));
    }

    const dailyUsers = new Map<string, Set<string>>();
    for (const ev of events) {
      if (!ev.userId) continue;
      const day = ev.createdAt.toISOString().slice(0, 10);
      if (!dailyUsers.has(day)) dailyUsers.set(day, new Set());
      dailyUsers.get(day)!.add(ev.userId);
    }

    return [...dailyUsers.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, usersSet]) => ({ date, count: usersSet.size }));
  },
};

export default dashboardService;

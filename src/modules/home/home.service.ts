import { findPublicPromptsWithVideoGate } from '@modules/prompts/prompt-visibility.service';

/**
 * Automated Home Feed Service
 *
 * Automatically generates a rich, mixed client-side home feed combining:
 * 1. Trending Prompts (highest trending score)
 * 2. New / Latest Prompts (most recently published)
 * 3. Premium Prompts (curated premium tier)
 * 4. Free Prompts (accessible without restriction)
 * 5. Featured Prompts (handpicked spotlight prompts)
 * 6. Mixed Interleaved Feed (smart deduplicated stream for waterfall/infinite grids)
 *
 * Provides both structured `sections` (for horizontal scroll carousels)
 * and direct lists (`trending`, `newPrompts`, `premium`, `free`, `mixed`).
 */
export const homePublicService = {
  async getHome(limitPerSection = 10) {
    const [trending, latest, premium, free, featured, daily] = await Promise.all([
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection, sort: 'trending' }),
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection, sort: 'latest' }),
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection, isPremium: true, sort: 'latest' }),
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection, isPremium: false, sort: 'latest' }),
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection, isFeatured: true, sort: 'latest' }),
      findPublicPromptsWithVideoGate({ page: 1, limit: limitPerSection * 2, sort: 'daily_shuffle' }),
    ]);

    // Build priority-first daily mixed feed without duplicate prompts
    const seenIds = new Set<string>();
    const mixed: any[] = [];

    // Priority 1: Synchronized feed prompts (Top Pinned section items first, then shuffled)
    for (const item of daily.items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        mixed.push(item);
      }
    }

    // Priority 2: Additional Featured prompts
    for (const item of featured.items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        mixed.push(item);
      }
    }

    // Fallback interleaving for any remaining items from other categories
    const maxLen = Math.max(
      trending.items.length,
      latest.items.length,
      premium.items.length,
      free.items.length,
    );

    for (let i = 0; i < maxLen; i++) {
      if (trending.items[i] && !seenIds.has(trending.items[i].id)) {
        seenIds.add(trending.items[i].id);
        mixed.push(trending.items[i]);
      }
      if (latest.items[i] && !seenIds.has(latest.items[i].id)) {
        seenIds.add(latest.items[i].id);
        mixed.push(latest.items[i]);
      }
      if (premium.items[i] && !seenIds.has(premium.items[i].id)) {
        seenIds.add(premium.items[i].id);
        mixed.push(premium.items[i]);
      }
      if (free.items[i] && !seenIds.has(free.items[i].id)) {
        seenIds.add(free.items[i].id);
        mixed.push(free.items[i]);
      }
    }

    const sections = [
      {
        id: 'trending',
        title: 'Trending Prompts',
        sectionType: 'TRENDING',
        prompts: trending.items,
      },
      {
        id: 'new_prompts',
        title: 'New Prompts',
        sectionType: 'LATEST',
        prompts: latest.items,
      },
      {
        id: 'premium',
        title: 'Premium Prompts',
        sectionType: 'PREMIUM',
        prompts: premium.items,
      },
      {
        id: 'free',
        title: 'Free Prompts',
        sectionType: 'FREE',
        prompts: free.items,
      },
      {
        id: 'featured',
        title: 'Featured Prompts',
        sectionType: 'FEATURED',
        prompts: featured.items,
      },
      {
        id: 'mixed',
        title: 'Mixed Feed',
        sectionType: 'MIXED',
        prompts: mixed,
      },
    ];

    return {
      sections,
      trending: trending.items,
      newPrompts: latest.items,
      latest: latest.items,
      premium: premium.items,
      free: free.items,
      featured: featured.items,
      mixed,
    };
  },
};

export default { homePublicService };

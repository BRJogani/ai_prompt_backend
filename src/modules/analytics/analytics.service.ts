import { AnalyticsEventType, DevicePlatform } from '@prisma/client';
import { analyticsRepository } from './analytics.repository';
import { promptRepository } from '@modules/prompts/prompt.repository';
import { NotFoundError } from '@utils/ApiError';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  promptId?: string;
  categoryId?: string;
  aiToolId?: string;
  metadata?: Record<string, unknown>;
  userId: string;
  platform?: DevicePlatform;
  appVersion?: string;
}

/**
 * Event types whose corresponding Prompt counter is maintained here.
 * PROMPT_FAVORITE/PROMPT_UNFAVORITE are deliberately excluded: the
 * Favorites module (Phase 5) already updates `favoriteCount` in the same
 * transaction as the Favorite row itself. Incrementing it again from an
 * event the client also fires would double-count every favorite.
 */
const VIEW_EVENTS = new Set<AnalyticsEventType>(['PROMPT_VIEW']);
const COPY_EVENTS = new Set<AnalyticsEventType>(['PROMPT_COPY']);
const SHARE_EVENTS = new Set<AnalyticsEventType>(['PROMPT_SHARE']);

export const analyticsService = {
  async trackEvent(params: TrackEventParams) {
    if (params.promptId) {
      const exists = await promptRepository.existsById(params.promptId);
      if (!exists) throw new NotFoundError('promptId does not reference an existing prompt');
    }

    const event = await analyticsRepository.createEvent({
      userId: params.userId,
      eventType: params.eventType,
      promptId: params.promptId,
      categoryId: params.categoryId,
      aiToolId: params.aiToolId,
      metadata: (params.metadata as any) ?? undefined,
      platform: params.platform,
      appVersion: params.appVersion,
    });

    if (params.promptId) {
      if (VIEW_EVENTS.has(params.eventType)) {
        await promptRepository.incrementViewCount(params.promptId);
      } else if (COPY_EVENTS.has(params.eventType)) {
        await promptRepository.incrementCopyCount(params.promptId);
      } else if (SHARE_EVENTS.has(params.eventType)) {
        await promptRepository.incrementShareCount(params.promptId);
      }
    }

    return event;
  },
};

export default analyticsService;

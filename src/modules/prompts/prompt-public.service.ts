import { ContentType } from '@prisma/client';
import { PromptSortOption } from './prompt.repository';
import { findPublicPromptsWithVideoGate, findPublicPromptByIdWithVideoGate } from './prompt-visibility.service';
import { NotFoundError } from '@utils/ApiError';

interface BrowseParams {
  page: number;
  limit: number;
  categoryId?: string;
  aiToolId?: string;
  contentType?: ContentType;
  isPremium?: boolean;
  sort?: PromptSortOption;
}

export const publicPromptService = {
  browse(params: BrowseParams) {
    return findPublicPromptsWithVideoGate(params);
  },

  trending(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, sort: 'trending' });
  },

  popular(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, sort: 'popular' });
  },

  latest(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, sort: 'latest' });
  },

  premium(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, isPremium: true, sort: 'latest' });
  },

  free(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, isPremium: false, sort: 'latest' });
  },

  /**
   * When video is globally disabled, the visibility gate's WHERE clause
   * excludes every VIDEO-only prompt — so this naturally (and correctly)
   * returns an empty page rather than needing special-case handling here.
   */
  popularVideos(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, sort: 'popular', contentType: 'VIDEO' });
  },

  popularImages(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, sort: 'popular', contentType: 'IMAGE' });
  },

  featured(page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, isFeatured: true, sort: 'latest' });
  },

  search(q: string, page: number, limit: number) {
    return findPublicPromptsWithVideoGate({ page, limit, search: q, sort: 'latest' });
  },

  async getById(id: string) {
    const prompt = await findPublicPromptByIdWithVideoGate(id);
    if (!prompt) throw new NotFoundError('Prompt not found');
    return prompt;
  },
};

export default publicPromptService;


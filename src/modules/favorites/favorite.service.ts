import { prisma } from '@config/database';
import { favoriteRepository } from './favorite.repository';
import { promptRepository } from '@modules/prompts/prompt.repository';
import { findPublicPromptByIdWithVideoGate } from '@modules/prompts/prompt-visibility.service';
import { ConflictError, NotFoundError } from '@utils/ApiError';

export const favoriteService = {
  async add(userId: string, promptId: string) {
    // Video-gated lookup — a prompt currently hidden by Sections 16-18's
    // visibility rule can't be favorited, for the same reason it can't be
    // found via any listing.
    const prompt = await findPublicPromptByIdWithVideoGate(promptId);
    if (!prompt) throw new NotFoundError('Prompt not found');

    const existing = await favoriteRepository.find(userId, promptId);
    if (existing) throw new ConflictError('Prompt is already in favorites');

    // Both writes succeed or fail together, so favorite_count never drifts
    // out of sync with the actual number of Favorite rows (Section 11).
    const [favorite] = await prisma.$transaction([
      favoriteRepository.create(userId, promptId),
      promptRepository.incrementFavoriteCount(promptId),
    ]);

    return favorite;
  },

  async remove(userId: string, promptId: string) {
    const existing = await favoriteRepository.find(userId, promptId);
    if (!existing) throw new NotFoundError('Favorite not found');

    await prisma.$transaction([
      favoriteRepository.delete(userId, promptId),
      promptRepository.decrementFavoriteCount(promptId),
    ]);
  },

  async list(userId: string, page: number, limit: number) {
    const { items, total } = await favoriteRepository.list(userId, page, limit);
    return {
      items: items.map((favorite) => ({ ...favorite.prompt, favoritedAt: favorite.createdAt })),
      total,
    };
  },
};

export default favoriteService;

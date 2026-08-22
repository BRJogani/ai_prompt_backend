import { historyRepository } from './history.repository';
import { findPublicPromptByIdWithVideoGate } from '@modules/prompts/prompt-visibility.service';
import { NotFoundError } from '@utils/ApiError';

export const historyService = {
  async record(userId: string, promptId: string) {
    // Video-gated lookup — mirrors the Favorites module: a prompt hidden
    // by the visibility rule can't be recorded into history either.
    const prompt = await findPublicPromptByIdWithVideoGate(promptId);
    if (!prompt) throw new NotFoundError('Prompt not found');
    return historyRepository.upsert(userId, promptId);
  },

  async list(userId: string, page: number, limit: number) {
    const { items, total } = await historyRepository.list(userId, page, limit);
    return {
      items: items.map((entry) => ({ ...entry.prompt, viewedAt: entry.viewedAt })),
      total,
    };
  },

  async clear(userId: string, promptId?: string) {
    if (promptId) {
      await historyRepository.clearOne(userId, promptId);
    } else {
      await historyRepository.clearAll(userId);
    }
  },
};

export default historyService;

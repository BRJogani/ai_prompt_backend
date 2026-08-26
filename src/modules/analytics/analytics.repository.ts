import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const analyticsRepository = {
  createEvent(data: Prisma.AnalyticsEventUncheckedCreateInput) {
    return prisma.analyticsEvent.create({ data });
  },

  async hasUserViewedPrompt(userId: string, promptId: string): Promise<boolean> {
    const existing = await prisma.analyticsEvent.findFirst({
      where: {
        userId,
        promptId,
        eventType: 'PROMPT_VIEW',
      },
      select: { id: true },
    });
    return existing !== null;
  },
};

export default analyticsRepository;

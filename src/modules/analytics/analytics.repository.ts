import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const analyticsRepository = {
  createEvent(data: Prisma.AnalyticsEventUncheckedCreateInput) {
    return prisma.analyticsEvent.create({ data });
  },
};

export default analyticsRepository;

import { prisma } from '@config/database';
import { AdType, TargetPlatform, Prisma } from '@prisma/client';

export const adConfigRepository = {
  create(data: Prisma.AdConfigCreateInput) {
    return prisma.adConfig.create({ data });
  },

  update(id: string, data: Prisma.AdConfigUpdateInput) {
    return prisma.adConfig.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.adConfig.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.adConfig.findUnique({ where: { id } });
  },

  findByTypeAndPlatform(adType: AdType, platform: TargetPlatform) {
    return prisma.adConfig.findUnique({ where: { adType_platform: { adType, platform } } });
  },

  list(params: { adType?: AdType; platform?: TargetPlatform; enabled?: boolean }) {
    const where: Prisma.AdConfigWhereInput = {
      ...(params.adType ? { adType: params.adType } : {}),
      ...(params.platform ? { platform: params.platform } : {}),
      ...(params.enabled !== undefined ? { enabled: params.enabled } : {}),
    };
    return prisma.adConfig.findMany({ where, orderBy: [{ adType: 'asc' }, { platform: 'asc' }] });
  },

  /** Immediate kill switch (Section 25) — every row, every type, every platform. */
  disableAll() {
    return prisma.adConfig.updateMany({ data: { enabled: false } });
  },

  /** Rows for a specific platform PLUS the ALL-platform fallback rows, for building the public config. */
  findForPlatform(platform: TargetPlatform) {
    return prisma.adConfig.findMany({ where: { OR: [{ platform }, { platform: 'ALL' }] } });
  },
};

export default adConfigRepository;

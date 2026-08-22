import { prisma } from '@config/database';
import { TargetPlatform } from '@prisma/client';

export const appVersionRepository = {
  listAll() {
    return prisma.appVersion.findMany({ orderBy: { platform: 'asc' } });
  },

  findByPlatform(platform: TargetPlatform) {
    return prisma.appVersion.findUnique({ where: { platform } });
  },

  upsert(
    platform: TargetPlatform,
    data: {
      latestVersion: string;
      minimumVersion: string;
      forceUpdate?: boolean;
      updateMessage?: string;
      storeUrl?: string;
      maintenanceMode?: boolean;
    },
  ) {
    return prisma.appVersion.upsert({
      where: { platform },
      update: data,
      create: { platform, ...data },
    });
  },
};

export default appVersionRepository;

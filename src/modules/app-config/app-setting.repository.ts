import { prisma } from '@config/database';

export const appSettingRepository = {
  findByKey(key: string) {
    return prisma.appSetting.findUnique({ where: { key } });
  },

  listAll() {
    return prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  },

  upsert(key: string, data: { value: string; valueType?: string; description?: string }) {
    return prisma.appSetting.upsert({
      where: { key },
      update: {
        value: data.value,
        ...(data.valueType ? { valueType: data.valueType } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      create: {
        key,
        value: data.value,
        valueType: data.valueType ?? 'string',
        description: data.description,
      },
    });
  },
};

export default appSettingRepository;

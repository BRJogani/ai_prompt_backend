import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const mediaRepository = {
  create(data: Prisma.PromptMediaUncheckedCreateInput) {
    return prisma.promptMedia.create({ data });
  },

  update(id: string, data: Prisma.PromptMediaUpdateInput) {
    return prisma.promptMedia.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.promptMedia.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.promptMedia.findUnique({ where: { id } });
  },

  findByPrompt(promptId: string) {
    return prisma.promptMedia.findMany({ where: { promptId }, orderBy: { sortOrder: 'asc' } });
  },

  count(promptId: string) {
    return prisma.promptMedia.count({ where: { promptId } });
  },

  updateSortOrder(id: string, sortOrder: number) {
    return prisma.promptMedia.update({ where: { id }, data: { sortOrder } });
  },
};

export default mediaRepository;

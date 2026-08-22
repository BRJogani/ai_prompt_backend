import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const homeSectionRepository = {
  create(data: Prisma.HomeSectionCreateInput) {
    return prisma.homeSection.create({ data });
  },

  update(id: string, data: Prisma.HomeSectionUpdateInput) {
    return prisma.homeSection.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.homeSection.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.homeSection.findUnique({ where: { id } });
  },

  listAll() {
    return prisma.homeSection.findMany({ orderBy: { sortOrder: 'asc' } });
  },

  listActive() {
    return prisma.homeSection.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
    });
  },
};

export default homeSectionRepository;

import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';

export const userRepository = {
  findByUniqueId(uniqueId: string) {
    return prisma.user.findUnique({ where: { uniqueId } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  touch(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
};

export default userRepository;

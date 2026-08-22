import { prisma } from '@config/database';
import { Prisma, ReportStatus } from '@prisma/client';

export const reportRepository = {
  create(data: Prisma.ReportUncheckedCreateInput) {
    return prisma.report.create({ data });
  },

  findById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: {
        prompt: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, uniqueId: true } },
        reviewedByAdmin: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async list(params: { status?: ReportStatus; page: number; limit: number }) {
    const where: Prisma.ReportWhereInput = params.status ? { status: params.status } : {};

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { prompt: { select: { id: true, title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return { items, total };
  },

  updateStatus(id: string, status: ReportStatus, reviewedByAdminId: string) {
    return prisma.report.update({
      where: { id },
      data: { status, reviewedByAdminId, reviewedAt: new Date() },
    });
  },
};

export default reportRepository;

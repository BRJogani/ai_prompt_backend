import { prisma } from '@config/database';
import { DevicePlatform, Prisma, PurchaseStatus } from '@prisma/client';

export const purchaseRepository = {
  create(data: {
    userId: string;
    productId: string;
    orderId?: string | null;
    purchaseToken?: string | null;
    platform: DevicePlatform;
    price?: number | null;
    currency?: string;
    status: PurchaseStatus;
    rawReceipt?: string | null;
  }) {
    return prisma.purchase.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        orderId: data.orderId,
        purchaseToken: data.purchaseToken,
        platform: data.platform,
        price: data.price,
        currency: data.currency || 'USD',
        status: data.status,
        rawReceipt: data.rawReceipt,
      },
      include: {
        user: {
          select: {
            id: true,
            uniqueId: true,
            platform: true,
            deviceModel: true,
            appVersion: true,
            isPremium: true,
          },
        },
      },
    });
  },

  findByOrderId(orderId: string) {
    return prisma.purchase.findFirst({
      where: { orderId },
    });
  },

  findActiveUserPurchase(userId: string, productId?: string) {
    return prisma.purchase.findFirst({
      where: {
        userId,
        ...(productId ? { productId } : {}),
        status: { in: [PurchaseStatus.COMPLETED, PurchaseStatus.RESTORED] },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  setUserPremium(userId: string, isPremium: boolean, premiumExpiresAt?: Date | null) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isPremium,
        premiumExpiresAt: premiumExpiresAt !== undefined ? premiumExpiresAt : null,
      },
    });
  },

  getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uniqueId: true,
        isPremium: true,
        premiumExpiresAt: true,
        platform: true,
      },
    });
  },

  async listAdmin(params: {
    page: number;
    limit: number;
    search?: string;
    platform?: DevicePlatform;
    status?: PurchaseStatus;
    productId?: string;
  }) {
    const { page, limit, search, platform, status, productId } = params;

    const where: Prisma.PurchaseWhereInput = {};

    if (platform) {
      where.platform = platform;
    }
    if (status) {
      where.status = status;
    }
    if (productId) {
      where.productId = { contains: productId, mode: 'insensitive' };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { productId: { contains: q, mode: 'insensitive' } },
        { orderId: { contains: q, mode: 'insensitive' } },
        { purchaseToken: { contains: q, mode: 'insensitive' } },
        { user: { uniqueId: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uniqueId: true,
              platform: true,
              deviceModel: true,
              osVersion: true,
              appVersion: true,
              isPremium: true,
              lastActiveAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    return { items, total };
  },

  async getAdminStats() {
    const [
      totalPurchases,
      completedPurchases,
      androidCount,
      iosCount,
      activePremiumUsers,
      allPurchasesWithPrice,
    ] = await Promise.all([
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: { in: [PurchaseStatus.COMPLETED, PurchaseStatus.RESTORED] } } }),
      prisma.purchase.count({ where: { platform: DevicePlatform.ANDROID } }),
      prisma.purchase.count({ where: { platform: DevicePlatform.IOS } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.purchase.findMany({
        where: {
          status: { in: [PurchaseStatus.COMPLETED, PurchaseStatus.RESTORED] },
          price: { not: null },
        },
        select: { price: true },
      }),
    ]);

    const totalRevenue = allPurchasesWithPrice.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      totalPurchases,
      completedPurchases,
      androidCount,
      iosCount,
      activePremiumUsers,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    };
  },
};

export default purchaseRepository;

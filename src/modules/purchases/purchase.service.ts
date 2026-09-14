import { DevicePlatform, PurchaseStatus } from '@prisma/client';
import { purchaseRepository } from './purchase.repository';
import { RecordPurchaseInput, AdminPurchaseQuery } from '@validators/purchase.validator';

export const purchaseService = {
  async recordPurchase(userId: string, input: RecordPurchaseInput) {
    const platform = (input.platform as DevicePlatform) || DevicePlatform.OTHER;
    const status = (input.status as PurchaseStatus) || PurchaseStatus.COMPLETED;

    // Check if orderId already registered (idempotency)
    if (input.orderId && input.orderId.trim().length > 0) {
      const existing = await purchaseRepository.findByOrderId(input.orderId.trim());
      if (existing) {
        if (status === PurchaseStatus.COMPLETED || status === PurchaseStatus.RESTORED) {
          await purchaseRepository.setUserPremium(userId, true);
        }
        return {
          purchase: existing,
          isPremium: true,
          message: 'Existing purchase verified',
        };
      }
    }

    const purchase = await purchaseRepository.create({
      userId,
      productId: input.productId,
      orderId: input.orderId?.trim() || null,
      purchaseToken: input.purchaseToken?.trim() || null,
      platform,
      price: input.price ?? 4.99,
      currency: input.currency || 'USD',
      status,
      rawReceipt: input.rawReceipt || null,
    });

    // If purchase is completed or restored, unlock premium for this user device
    if (status === PurchaseStatus.COMPLETED || status === PurchaseStatus.RESTORED) {
      await purchaseRepository.setUserPremium(userId, true);
    }

    return {
      purchase,
      isPremium: status === PurchaseStatus.COMPLETED || status === PurchaseStatus.RESTORED,
      message: 'Purchase recorded successfully',
    };
  },

  async getUserPurchaseStatus(userId: string) {
    const user = await purchaseRepository.getUserById(userId);
    const activePurchase = await purchaseRepository.findActiveUserPurchase(userId);

    const isPremium = Boolean(user?.isPremium || activePurchase);

    // Self-heal user record if active purchase found but flag wasn't true
    if (activePurchase && !user?.isPremium) {
      await purchaseRepository.setUserPremium(userId, true);
    }

    return {
      isPremium,
      productId: activePurchase?.productId || (isPremium ? 'ai_prompt' : null),
      purchaseDate: activePurchase?.purchaseDate || null,
      orderId: activePurchase?.orderId || null,
    };
  },

  async listAdmin(query: AdminPurchaseQuery) {
    const { page, limit, search, platform, status, productId } = query;
    return purchaseRepository.listAdmin({
      page,
      limit,
      search,
      platform: platform as DevicePlatform | undefined,
      status: status as PurchaseStatus | undefined,
      productId,
    });
  },

  async getAdminStats() {
    return purchaseRepository.getAdminStats();
  },
};

export default purchaseService;

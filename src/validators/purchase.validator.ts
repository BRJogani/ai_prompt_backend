import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const recordPurchaseSchema = z.object({
  productId: z.string().min(1, 'Product ID (SKU) is required'),
  orderId: z.string().optional().nullable(),
  purchaseToken: z.string().optional().nullable(),
  platform: z.enum(['ANDROID', 'IOS', 'OTHER']).optional().default('OTHER'),
  price: z.coerce.number().optional().nullable(),
  currency: z.string().optional().default('USD'),
  rawReceipt: z.string().optional().nullable(),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'RESTORED', 'REFUNDED']).optional().default('COMPLETED'),
});

export type RecordPurchaseInput = z.infer<typeof recordPurchaseSchema>;

export const adminPurchaseQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  platform: z.enum(['ANDROID', 'IOS', 'OTHER']).optional(),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'RESTORED', 'REFUNDED']).optional(),
  productId: z.string().optional(),
});

export type AdminPurchaseQuery = z.infer<typeof adminPurchaseQuerySchema>;

import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { purchaseService } from './purchase.service';
import { AdminPurchaseQuery, RecordPurchaseInput } from '@validators/purchase.validator';

export const purchaseController = {
  // Mobile client: records purchase transaction & grants premium status
  record: catchAsync(async (req: Request, res: Response) => {
    const input = req.body as RecordPurchaseInput;
    const result = await purchaseService.recordPurchase(req.deviceUser!.id, input);
    return sendSuccess(res, result, result.message, 201);
  }),

  // Mobile client: checks if current device UUID has active premium status
  checkStatus: catchAsync(async (req: Request, res: Response) => {
    const status = await purchaseService.getUserPurchaseStatus(req.deviceUser!.id);
    return sendSuccess(res, status, 'User purchase status');
  }),

  // Admin portal: lists all purchases with search, platform/status filters, pagination
  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminPurchaseQuery;
    const { items, total } = await purchaseService.listAdmin(query);
    return sendSuccess(
      res,
      items,
      'Purchases list',
      200,
      buildPaginationMeta(query.page, query.limit, total),
    );
  }),

  // Admin portal: aggregated metrics (revenue, total count, platform breakdown, active users)
  adminStats: catchAsync(async (_req: Request, res: Response) => {
    const stats = await purchaseService.getAdminStats();
    return sendSuccess(res, stats, 'Purchase metrics');
  }),
};

export default purchaseController;

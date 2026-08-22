import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { historyService } from './history.service';
import { PaginationQuery } from '@validators/common.validator';
import { ClearHistoryQuery } from '@validators/history.validator';

export const historyController = {
  record: catchAsync(async (req: Request, res: Response) => {
    const entry = await historyService.record(req.deviceUser!.id, req.body.promptId);
    return sendSuccess(res, entry, 'History recorded', 201);
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await historyService.list(req.deviceUser!.id, page, limit);
    return sendSuccess(res, items, 'History', 200, buildPaginationMeta(page, limit, total));
  }),

  clear: catchAsync(async (req: Request, res: Response) => {
    const { promptId } = req.query as unknown as ClearHistoryQuery;
    await historyService.clear(req.deviceUser!.id, promptId);
    return sendSuccess(res, null, promptId ? 'History entry removed' : 'History cleared');
  }),
};

export default historyController;

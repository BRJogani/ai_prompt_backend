import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { favoriteService } from './favorite.service';
import { PaginationQuery } from '@validators/common.validator';

export const favoriteController = {
  add: catchAsync(async (req: Request, res: Response) => {
    const favorite = await favoriteService.add(req.deviceUser!.id, req.body.promptId);
    return sendSuccess(res, favorite, 'Added to favorites', 201);
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await favoriteService.remove(req.deviceUser!.id, req.params.promptId);
    return sendSuccess(res, null, 'Removed from favorites');
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await favoriteService.list(req.deviceUser!.id, page, limit);
    return sendSuccess(res, items, 'Favorites', 200, buildPaginationMeta(page, limit, total));
  }),
};

export default favoriteController;

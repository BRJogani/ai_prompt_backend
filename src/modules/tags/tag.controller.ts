import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { tagService } from './tag.service';
import { TagListQuery } from '@validators/tag.validator';

export const tagController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const tag = await tagService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, tag, 'Tag created', 201);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const tag = await tagService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, tag, 'Tag updated');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await tagService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Tag deleted');
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const tag = await tagService.getById(req.params.id);
    return sendSuccess(res, tag, 'Tag');
  }),

  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as TagListQuery;
    const { items, total } = await tagService.list(query);
    return sendSuccess(res, items, 'Tags', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  publicList: catchAsync(async (_req: Request, res: Response) => {
    const tags = await tagService.listPublic();
    return sendSuccess(res, tags, 'Tags');
  }),
};

export default tagController;

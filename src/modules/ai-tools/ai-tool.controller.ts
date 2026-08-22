import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { aiToolService } from './ai-tool.service';
import { AiToolListQuery } from '@validators/ai-tool.validator';

export const aiToolController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const tool = await aiToolService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, tool, 'AI tool created', 201);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const tool = await aiToolService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, tool, 'AI tool updated');
  }),

  setStatus: catchAsync(async (req: Request, res: Response) => {
    const tool = await aiToolService.setStatus(req.params.id, req.body.status, req.admin!.id, req.ip);
    return sendSuccess(res, tool, 'AI tool status updated');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await aiToolService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'AI tool deleted');
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const tool = await aiToolService.getById(req.params.id);
    return sendSuccess(res, tool, 'AI tool');
  }),

  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as AiToolListQuery;
    const { items, total } = await aiToolService.list(query);
    return sendSuccess(res, items, 'AI tools', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  publicList: catchAsync(async (_req: Request, res: Response) => {
    const tools = await aiToolService.listPublic();
    return sendSuccess(res, tools, 'AI tools');
  }),

  publicGetById: catchAsync(async (req: Request, res: Response) => {
    const tool = await aiToolService.getById(req.params.id);
    return sendSuccess(res, tool, 'AI tool');
  }),
};

export default aiToolController;

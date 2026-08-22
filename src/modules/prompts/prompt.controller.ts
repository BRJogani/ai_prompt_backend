import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { promptService } from './prompt.service';
import { PromptListQuery } from '@validators/prompt.validator';

export const promptController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt created', 201);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt updated');
  }),

  duplicate: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.duplicate(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt duplicated', 201);
  }),

  publish: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.publish(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt published');
  }),

  unpublish: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.unpublish(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt unpublished');
  }),

  archive: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.archive(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt archived');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await promptService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Prompt deleted');
  }),

  setFlags: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.setFlags(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Prompt flags updated');
  }),

  attachTags: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.attachTags(req.params.id, req.body.tagSlugs, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Tags attached');
  }),

  detachTag: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.detachTag(req.params.id, req.params.tagId, req.admin!.id, req.ip);
    return sendSuccess(res, prompt, 'Tag detached');
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const prompt = await promptService.getById(req.params.id);
    return sendSuccess(res, prompt, 'Prompt');
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as PromptListQuery;
    const { items, total } = await promptService.list(query);
    return sendSuccess(res, items, 'Prompts', 200, buildPaginationMeta(query.page, query.limit, total));
  }),
};

export default promptController;

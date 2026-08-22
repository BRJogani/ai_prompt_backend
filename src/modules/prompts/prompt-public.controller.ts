import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { publicPromptService } from './prompt-public.service';
import { PublicPromptListQuery, PromptSearchQuery } from '@validators/prompt.validator';
import { PaginationQuery } from '@validators/common.validator';

export const publicPromptController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as PublicPromptListQuery;
    const { items, total } = await publicPromptService.browse(query);
    return sendSuccess(res, items, 'Prompts', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  trending: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.trending(page, limit);
    return sendSuccess(res, items, 'Trending prompts', 200, buildPaginationMeta(page, limit, total));
  }),

  popular: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.popular(page, limit);
    return sendSuccess(res, items, 'Popular prompts', 200, buildPaginationMeta(page, limit, total));
  }),

  latest: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.latest(page, limit);
    return sendSuccess(res, items, 'Latest prompts', 200, buildPaginationMeta(page, limit, total));
  }),

  popularVideos: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.popularVideos(page, limit);
    return sendSuccess(res, items, 'Popular videos', 200, buildPaginationMeta(page, limit, total));
  }),

  popularImages: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.popularImages(page, limit);
    return sendSuccess(res, items, 'Popular images', 200, buildPaginationMeta(page, limit, total));
  }),

  featured: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await publicPromptService.featured(page, limit);
    return sendSuccess(res, items, 'Featured prompts', 200, buildPaginationMeta(page, limit, total));
  }),

  search: catchAsync(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query as unknown as PromptSearchQuery;
    const { items, total } = await publicPromptService.search(q, page, limit);
    return sendSuccess(res, items, 'Search results', 200, buildPaginationMeta(page, limit, total));
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const prompt = await publicPromptService.getById(req.params.id);
    return sendSuccess(res, prompt, 'Prompt');
  }),
};

export default publicPromptController;

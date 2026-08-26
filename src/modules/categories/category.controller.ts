import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { categoryService } from './category.service';
import { CategoryListQuery } from '@validators/category.validator';
import { PaginationQuery } from '@validators/common.validator';

export const categoryController = {
  // ---- Admin ---------------------------------------------------------
  create: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, category, 'Category created', 201);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, category, 'Category updated');
  }),

  setStatus: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.setStatus(req.params.id, req.body.status, req.admin!.id, req.ip);
    return sendSuccess(res, category, 'Category status updated');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await categoryService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Category deleted');
  }),

  uploadImage: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }
    const category = await categoryService.uploadImage(req.params.id, req.file, req.admin!.id, req.ip);
    return sendSuccess(res, category, 'Category image uploaded successfully');
  }),

  uploadDirectImage: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }
    const result = await categoryService.uploadDirectImage(req.file);
    return sendSuccess(res, result, 'Image uploaded successfully');
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    return sendSuccess(res, category, 'Category');
  }),

  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as CategoryListQuery;
    const { items, total } = await categoryService.list(query);
    return sendSuccess(res, items, 'Categories', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  // ---- Public ---------------------------------------------------------
  publicList: catchAsync(async (_req: Request, res: Response) => {
    const categories = await categoryService.listPublic();
    return sendSuccess(res, categories, 'Categories');
  }),

  publicGetById: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    return sendSuccess(res, category, 'Category');
  }),

  publicPrompts: catchAsync(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { items, total } = await categoryService.getPublishedPromptsForCategory(req.params.id, page, limit);
    return sendSuccess(res, items, 'Prompts', 200, buildPaginationMeta(page, limit, total));
  }),
};

export default categoryController;

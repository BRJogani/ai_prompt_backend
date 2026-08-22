import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { mediaService } from './media.service';
import { ValidationError } from '@utils/ApiError';

export const mediaController = {
  upload: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('No file uploaded (expected multipart field "file")');
    const media = await mediaService.uploadForPrompt(req.params.promptId, req.file, req.admin!.id, req.ip);
    return sendSuccess(res, media, 'Media uploaded', 201);
  }),

  replace: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('No file uploaded (expected multipart field "file")');
    const media = await mediaService.replace(req.params.mediaId, req.file, req.admin!.id, req.ip);
    return sendSuccess(res, media, 'Media replaced');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await mediaService.remove(req.params.mediaId, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Media deleted');
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const media = await mediaService.listForPrompt(req.params.promptId);
    return sendSuccess(res, media, 'Prompt media');
  }),

  reorder: catchAsync(async (req: Request, res: Response) => {
    const media = await mediaService.reorder(req.params.promptId, req.body.order, req.admin!.id, req.ip);
    return sendSuccess(res, media, 'Media reordered');
  }),
};

export default mediaController;

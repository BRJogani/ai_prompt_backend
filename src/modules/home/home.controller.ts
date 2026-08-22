import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { homeSectionAdminService, homePublicService } from './home.service';

export const homeController = {
  // ---- Admin ---------------------------------------------------------
  create: catchAsync(async (req: Request, res: Response) => {
    const section = await homeSectionAdminService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, section, 'Home section created', 201);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const section = await homeSectionAdminService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, section, 'Home section updated');
  }),

  setStatus: catchAsync(async (req: Request, res: Response) => {
    const section = await homeSectionAdminService.setStatus(req.params.id, req.body.status, req.admin!.id, req.ip);
    return sendSuccess(res, section, 'Home section status updated');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await homeSectionAdminService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Home section deleted');
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const section = await homeSectionAdminService.getById(req.params.id);
    return sendSuccess(res, section, 'Home section');
  }),

  adminList: catchAsync(async (_req: Request, res: Response) => {
    const sections = await homeSectionAdminService.list();
    return sendSuccess(res, sections, 'Home sections');
  }),

  // ---- Public ---------------------------------------------------------
  getHome: catchAsync(async (_req: Request, res: Response) => {
    const sections = await homePublicService.getHome();
    return sendSuccess(res, { sections }, 'Home');
  }),
};

export default homeController;

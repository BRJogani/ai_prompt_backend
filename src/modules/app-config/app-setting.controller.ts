import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { appSettingService } from './app-setting.service';

export const appSettingController = {
  adminList: catchAsync(async (_req: Request, res: Response) => {
    const settings = await appSettingService.list();
    return sendSuccess(res, settings, 'App settings');
  }),

  adminGetByKey: catchAsync(async (req: Request, res: Response) => {
    const setting = await appSettingService.getByKey(req.params.key);
    return sendSuccess(res, setting, 'App setting');
  }),

  adminCreate: catchAsync(async (req: Request, res: Response) => {
    const setting = await appSettingService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, setting, 'App setting created', 201);
  }),

  adminUpdate: catchAsync(async (req: Request, res: Response) => {
    const setting = await appSettingService.update(req.params.key, req.body.value, req.admin!.id, req.ip);
    return sendSuccess(res, setting, 'App setting updated');
  }),

  publicGetConfig: catchAsync(async (_req: Request, res: Response) => {
    const config = await appSettingService.getPublicConfig();
    return sendSuccess(res, config, 'App configuration');
  }),
};

export default appSettingController;

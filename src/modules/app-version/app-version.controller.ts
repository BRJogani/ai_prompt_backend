import { Request, Response } from 'express';
import { TargetPlatform } from '@prisma/client';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { appVersionService } from './app-version.service';
import { CheckVersionQuery } from '@validators/app-version.validator';

export const appVersionController = {
  adminList: catchAsync(async (_req: Request, res: Response) => {
    const versions = await appVersionService.list();
    return sendSuccess(res, versions, 'App versions');
  }),

  adminGetByPlatform: catchAsync(async (req: Request, res: Response) => {
    const version = await appVersionService.getByPlatform(req.params.platform as TargetPlatform);
    return sendSuccess(res, version, 'App version');
  }),

  adminUpsert: catchAsync(async (req: Request, res: Response) => {
    const version = await appVersionService.upsert(
      req.params.platform as TargetPlatform,
      req.body,
      req.admin!.id,
      req.ip,
    );
    return sendSuccess(res, version, 'App version updated');
  }),

  publicCheck: catchAsync(async (req: Request, res: Response) => {
    const { platform, currentVersion } = req.query as unknown as CheckVersionQuery;
    const result = await appVersionService.check(platform, currentVersion);
    return sendSuccess(res, result, 'App version info');
  }),
};

export default appVersionController;

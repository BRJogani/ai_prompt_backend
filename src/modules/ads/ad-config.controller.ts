import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { adConfigService } from './ad-config.service';
import { AdConfigListQuery, PublicAdConfigQuery } from '@validators/ad-config.validator';

export const adConfigController = {
  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdConfigListQuery;
    const configs = await adConfigService.list(query);
    return sendSuccess(res, configs, 'Ad configs');
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const config = await adConfigService.getById(req.params.id);
    return sendSuccess(res, config, 'Ad config');
  }),

  adminCreate: catchAsync(async (req: Request, res: Response) => {
    const config = await adConfigService.create(req.body, req.admin!.id, req.ip);
    return sendSuccess(res, config, 'Ad config created', 201);
  }),

  adminUpdate: catchAsync(async (req: Request, res: Response) => {
    const config = await adConfigService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, config, 'Ad config updated');
  }),

  adminRemove: catchAsync(async (req: Request, res: Response) => {
    await adConfigService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Ad config deleted');
  }),

  adminDisableAll: catchAsync(async (req: Request, res: Response) => {
    const result = await adConfigService.disableAll(req.admin!.id, req.ip);
    return sendSuccess(res, result, 'All ad configs disabled');
  }),

  publicGetConfig: catchAsync(async (req: Request, res: Response) => {
    const { platform } = req.query as unknown as PublicAdConfigQuery;
    const config = await adConfigService.getPublicConfig(platform);
    return sendSuccess(res, config, 'Ad configuration');
  }),
};

export default adConfigController;

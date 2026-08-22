import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { analyticsService } from './analytics.service';
import { TrackEventInput } from '@validators/analytics.validator';
import { parseDevicePlatform, headerString } from '@utils/devicePlatform';
import { recalculateTrendingScores } from '@jobs/recalculateTrending.job';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

export const analyticsController = {
  track: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as TrackEventInput;
    const event = await analyticsService.trackEvent({
      ...body,
      userId: req.deviceUser!.id,
      platform: parseDevicePlatform(headerString(req.headers['x-platform'])),
      appVersion: headerString(req.headers['x-app-version']),
    });
    return sendSuccess(res, event, 'Event recorded', 201);
  }),

  adminRecalculateTrending: catchAsync(async (req: Request, res: Response) => {
    const result = await recalculateTrendingScores();

    await recordAuditLog({
      adminId: req.admin!.id,
      action: AUDIT_ACTIONS.RECALCULATE_TRENDING,
      entityType: 'Prompt',
      metadata: result,
      ipAddress: req.ip,
    });

    return sendSuccess(res, result, 'Trending scores recalculated');
  }),
};

export default analyticsController;

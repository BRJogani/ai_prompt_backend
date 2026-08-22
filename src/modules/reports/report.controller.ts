import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { reportService } from './report.service';
import { ReportListQuery } from '@validators/report.validator';

export const reportController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const report = await reportService.create(req.deviceUser!.id, req.body);
    return sendSuccess(res, report, 'Report submitted', 201);
  }),

  adminList: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportListQuery;
    const { items, total } = await reportService.list(query);
    return sendSuccess(res, items, 'Reports', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  adminGetById: catchAsync(async (req: Request, res: Response) => {
    const report = await reportService.getById(req.params.id);
    return sendSuccess(res, report, 'Report');
  }),

  adminUpdateStatus: catchAsync(async (req: Request, res: Response) => {
    const report = await reportService.updateStatus(req.params.id, req.body.status, req.admin!.id, req.ip);
    return sendSuccess(res, report, 'Report status updated');
  }),
};

export default reportController;

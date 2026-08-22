import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { auditLogService } from './audit-log.service';
import { AuditLogListQuery } from '@validators/audit-log.validator';

export const auditLogController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as AuditLogListQuery;
    const { items, total } = await auditLogService.list(query);
    return sendSuccess(res, items, 'Audit logs', 200, buildPaginationMeta(query.page, query.limit, total));
  }),
};

export default auditLogController;

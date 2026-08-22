import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess, buildPaginationMeta } from '@utils/ApiResponse';
import { adminUserService } from './admin-user.service';
import { AdminUserListQuery } from '@validators/admin-user.validator';

export const adminUserController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminUserListQuery;
    const { items, total } = await adminUserService.list(query);
    return sendSuccess(res, items, 'Admin users', 200, buildPaginationMeta(query.page, query.limit, total));
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const admin = await adminUserService.getById(req.params.id);
    return sendSuccess(res, admin, 'Admin user');
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const admin = await adminUserService.update(req.params.id, req.body, req.admin!.id, req.ip);
    return sendSuccess(res, admin, 'Admin user updated');
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await adminUserService.remove(req.params.id, req.admin!.id, req.ip);
    return sendSuccess(res, null, 'Admin user deleted');
  }),
};

export default adminUserController;

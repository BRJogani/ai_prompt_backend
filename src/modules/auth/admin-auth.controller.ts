import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { AuthenticationError } from '@utils/ApiError';
import { adminAuthService } from './admin-auth.service';
import { LoginInput, RefreshInput, RegisterAdminInput, ChangePasswordInput } from '@validators/admin-auth.validator';

export const adminAuthController = {
  login: catchAsync(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const { email, password } = req.body;
    const result = await adminAuthService.login(email, password, req.ip);
    return sendSuccess(res, result, 'Login successful');
  }),

  refresh: catchAsync(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
    const { refreshToken } = req.body;
    const result = await adminAuthService.refresh(refreshToken);
    return sendSuccess(res, result, 'Token refreshed');
  }),

  logout: catchAsync(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
    const { refreshToken } = req.body;
    await adminAuthService.logout(refreshToken, req.admin?.id, req.ip);
    return sendSuccess(res, null, 'Logged out successfully');
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    if (!req.admin) throw new AuthenticationError();
    const admin = await adminAuthService.getMe(req.admin.id);
    return sendSuccess(res, admin, 'Current admin profile');
  }),

  registerAdmin: catchAsync(async (req: Request<unknown, unknown, RegisterAdminInput>, res: Response) => {
    if (!req.admin) throw new AuthenticationError();
    const admin = await adminAuthService.registerAdmin(req.body, { id: req.admin.id, ipAddress: req.ip });
    return sendSuccess(res, admin, 'Admin account created', 201);
  }),

  changePassword: catchAsync(async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    if (!req.admin) throw new AuthenticationError();
    const { currentPassword, newPassword } = req.body;
    await adminAuthService.changePassword(req.admin.id, currentPassword, newPassword, req.ip);
    return sendSuccess(res, null, 'Password changed successfully');
  }),
};

export default adminAuthController;

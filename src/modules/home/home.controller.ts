import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { homePublicService } from './home.service';

export const homeController = {
  getHome: catchAsync(async (_req: Request, res: Response) => {
    const homeData = await homePublicService.getHome();
    return sendSuccess(res, homeData, 'Home feed');
  }),
};

export default homeController;

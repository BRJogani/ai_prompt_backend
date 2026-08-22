import { Router } from 'express';
import { homeController } from './home.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_WRITE_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  createHomeSectionSchema,
  updateHomeSectionSchema,
  homeSectionStatusSchema,
} from '@validators/home.validator';
import { idParamSchema } from '@validators/common.validator';

export const adminHomeSectionRouter = Router();
adminHomeSectionRouter.use(authenticate);

adminHomeSectionRouter.get('/', authorize(...CONTENT_WRITE_ROLES), homeController.adminList);
adminHomeSectionRouter.get(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  homeController.adminGetById,
);
adminHomeSectionRouter.post(
  '/',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(createHomeSectionSchema),
  homeController.create,
);
adminHomeSectionRouter.patch(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateHomeSectionSchema),
  homeController.update,
);
adminHomeSectionRouter.patch(
  '/:id/status',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(homeSectionStatusSchema),
  homeController.setStatus,
);
adminHomeSectionRouter.delete(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  homeController.remove,
);

export const publicHomeRouter = Router();
publicHomeRouter.get('/', homeController.getHome);

export default { adminHomeSectionRouter, publicHomeRouter };

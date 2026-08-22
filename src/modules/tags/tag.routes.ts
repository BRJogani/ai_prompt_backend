import { Router } from 'express';
import { tagController } from './tag.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_WRITE_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import { createTagSchema, updateTagSchema, tagListQuerySchema } from '@validators/tag.validator';
import { idParamSchema } from '@validators/common.validator';

export const adminTagRouter = Router();
adminTagRouter.use(authenticate);

adminTagRouter.get('/', authorize(...CONTENT_WRITE_ROLES), validate(tagListQuerySchema, 'query'), tagController.adminList);
adminTagRouter.get('/:id', authorize(...CONTENT_WRITE_ROLES), validate(idParamSchema(), 'params'), tagController.adminGetById);
adminTagRouter.post('/', authorize(...CONTENT_WRITE_ROLES), validate(createTagSchema), tagController.create);
adminTagRouter.put(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateTagSchema),
  tagController.update,
);
adminTagRouter.patch(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateTagSchema),
  tagController.update,
);
adminTagRouter.delete('/:id', authorize(...CONTENT_MANAGE_ROLES), validate(idParamSchema(), 'params'), tagController.remove);

export const publicTagRouter = Router();
publicTagRouter.get('/', tagController.publicList);

export default { adminTagRouter, publicTagRouter };

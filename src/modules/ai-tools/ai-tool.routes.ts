import { Router } from 'express';
import { aiToolController } from './ai-tool.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_WRITE_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  createAiToolSchema,
  updateAiToolSchema,
  aiToolStatusSchema,
  aiToolListQuerySchema,
} from '@validators/ai-tool.validator';
import { idParamSchema } from '@validators/common.validator';

export const adminAiToolRouter = Router();
adminAiToolRouter.use(authenticate);

adminAiToolRouter.get(
  '/',
  authorize(...CONTENT_WRITE_ROLES),
  validate(aiToolListQuerySchema, 'query'),
  aiToolController.adminList,
);
adminAiToolRouter.get(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  aiToolController.adminGetById,
);
adminAiToolRouter.post('/', authorize(...CONTENT_WRITE_ROLES), validate(createAiToolSchema), aiToolController.create);
adminAiToolRouter.put(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateAiToolSchema),
  aiToolController.update,
);
adminAiToolRouter.patch(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateAiToolSchema),
  aiToolController.update,
);
adminAiToolRouter.patch(
  '/:id/status',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(aiToolStatusSchema),
  aiToolController.setStatus,
);
adminAiToolRouter.delete(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  aiToolController.remove,
);

export const publicAiToolRouter = Router();
publicAiToolRouter.get('/', aiToolController.publicList);
publicAiToolRouter.get('/:id', validate(idParamSchema(), 'params'), aiToolController.publicGetById);

export default { adminAiToolRouter, publicAiToolRouter };

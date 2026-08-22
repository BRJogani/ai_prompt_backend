import { Router } from 'express';
import { promptController } from './prompt.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_WRITE_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  createPromptSchema,
  updatePromptSchema,
  promptFlagsSchema,
  attachTagsSchema,
  promptTagParamsSchema,
  promptListQuerySchema,
} from '@validators/prompt.validator';
import { idParamSchema } from '@validators/common.validator';
import { promptMediaRouter } from '@modules/media/media.routes';

export const adminPromptRouter = Router();
adminPromptRouter.use(authenticate);

adminPromptRouter.get(
  '/',
  authorize(...CONTENT_WRITE_ROLES),
  validate(promptListQuerySchema, 'query'),
  promptController.list,
);
adminPromptRouter.get(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.getById,
);
adminPromptRouter.post('/', authorize(...CONTENT_WRITE_ROLES), validate(createPromptSchema), promptController.create);
adminPromptRouter.patch(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updatePromptSchema),
  promptController.update,
);
adminPromptRouter.put(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updatePromptSchema),
  promptController.update,
);
adminPromptRouter.post(
  '/:id/duplicate',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.duplicate,
);

// Publish/unpublish/archive/delete are content-management actions, restricted
// to CONTENT_ADMIN/SUPER_ADMIN — EDITOR can create/edit but not ship or remove.
adminPromptRouter.post(
  '/:id/publish',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.publish,
);
adminPromptRouter.post(
  '/:id/unpublish',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.unpublish,
);
adminPromptRouter.post(
  '/:id/archive',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.archive,
);
adminPromptRouter.delete(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  promptController.remove,
);
adminPromptRouter.patch(
  '/:id/flags',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(promptFlagsSchema),
  promptController.setFlags,
);

adminPromptRouter.post(
  '/:id/tags',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(attachTagsSchema),
  promptController.attachTags,
);
adminPromptRouter.delete(
  '/:id/tags/:tagId',
  authorize(...CONTENT_WRITE_ROLES),
  validate(promptTagParamsSchema, 'params'),
  promptController.detachTag,
);

// Nested media routes: /api/v1/admin/prompts/:promptId/media
adminPromptRouter.use('/:promptId/media', promptMediaRouter);

export default adminPromptRouter;

import { Router } from 'express';
import { mediaController } from './media.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { uploadMedia } from '@middleware/upload';
import { CONTENT_WRITE_ROLES } from '@constants/roles';
import { reorderMediaSchema } from '@validators/media.validator';
import { idParamSchema } from '@validators/common.validator';

/**
 * Mounted at /api/v1/admin/prompts/:promptId/media (mergeParams so
 * :promptId, set by the parent router, is visible here).
 */
export const promptMediaRouter = Router({ mergeParams: true });
promptMediaRouter.use(authenticate, authorize(...CONTENT_WRITE_ROLES));

promptMediaRouter.get('/', validate(idParamSchema('promptId'), 'params'), mediaController.list);
promptMediaRouter.post('/', validate(idParamSchema('promptId'), 'params'), uploadMedia, mediaController.upload);
promptMediaRouter.patch(
  '/reorder',
  validate(idParamSchema('promptId'), 'params'),
  validate(reorderMediaSchema),
  mediaController.reorder,
);

/** Mounted at /api/v1/admin/media/:mediaId. */
export const mediaRouter = Router();
mediaRouter.use(authenticate, authorize(...CONTENT_WRITE_ROLES));

mediaRouter.put('/:mediaId', validate(idParamSchema('mediaId'), 'params'), uploadMedia, mediaController.replace);
mediaRouter.delete('/:mediaId', validate(idParamSchema('mediaId'), 'params'), mediaController.remove);

export default { promptMediaRouter, mediaRouter };

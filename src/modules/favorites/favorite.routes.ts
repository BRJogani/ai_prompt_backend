import { Router } from 'express';
import { favoriteController } from './favorite.controller';
import { resolveDeviceUser } from '@middleware/resolveDeviceUser';
import { validate } from '@middleware/validate';
import { addFavoriteSchema } from '@validators/favorite.validator';
import { paginationQuerySchema, idParamSchema } from '@validators/common.validator';

const router = Router();
router.use(resolveDeviceUser);

router.get('/', validate(paginationQuerySchema, 'query'), favoriteController.list);
router.post('/', validate(addFavoriteSchema), favoriteController.add);
router.delete('/:promptId', validate(idParamSchema('promptId'), 'params'), favoriteController.remove);

export default router;

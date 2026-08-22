import { Router } from 'express';
import { historyController } from './history.controller';
import { resolveDeviceUser } from '@middleware/resolveDeviceUser';
import { validate } from '@middleware/validate';
import { addHistorySchema, clearHistoryQuerySchema } from '@validators/history.validator';
import { paginationQuerySchema } from '@validators/common.validator';

const router = Router();
router.use(resolveDeviceUser);

router.get('/', validate(paginationQuerySchema, 'query'), historyController.list);
router.post('/', validate(addHistorySchema), historyController.record);
router.delete('/', validate(clearHistoryQuerySchema, 'query'), historyController.clear);

export default router;

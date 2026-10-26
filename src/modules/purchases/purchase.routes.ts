import { Router } from 'express';
import { purchaseController } from './purchase.controller';
import { resolveDeviceUser } from '@middleware/resolveDeviceUser';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { DASHBOARD_READ_ROLES } from '@constants/roles';
import {
  recordPurchaseSchema,
  adminPurchaseQuerySchema,
} from '@validators/purchase.validator';

// ---------------------------------------------------------------------
// Public Router — mounted at /api/v1/purchases
// Identifies device via X-Device-ID header
// ---------------------------------------------------------------------
export const publicPurchaseRouter = Router();

// Public product catalog & discount details — accessible without device header
publicPurchaseRouter.get('/products', purchaseController.getProducts);

// Device user resolution for transactional endpoints
publicPurchaseRouter.use(resolveDeviceUser);

publicPurchaseRouter.post('/', validate(recordPurchaseSchema), purchaseController.record);
publicPurchaseRouter.get('/status', purchaseController.checkStatus);
publicPurchaseRouter.post('/reset', purchaseController.resetStatus);

// ---------------------------------------------------------------------
// Admin Router — mounted at /api/v1/admin/purchases
// Requires Admin authentication
// ---------------------------------------------------------------------
export const adminPurchaseRouter = Router();

adminPurchaseRouter.use(authenticate);

adminPurchaseRouter.get(
  '/',
  authorize(...DASHBOARD_READ_ROLES),
  validate(adminPurchaseQuerySchema, 'query'),
  purchaseController.adminList,
);

adminPurchaseRouter.get(
  '/stats',
  authorize(...DASHBOARD_READ_ROLES),
  purchaseController.adminStats,
);

adminPurchaseRouter.get(
  '/products',
  authorize(...DASHBOARD_READ_ROLES),
  purchaseController.getProducts,
);

export default { publicPurchaseRouter, adminPurchaseRouter };

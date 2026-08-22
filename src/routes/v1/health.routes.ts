import { Router, Request, Response } from 'express';
import { prisma } from '@config/database';
import { sendSuccess } from '@utils/ApiResponse';
import { catchAsync } from '@utils/catchAsync';

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Liveness/readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service and database are healthy
 *       503:
 *         description: Database is unreachable
 */
router.get(
  '/',
  catchAsync(async (_req: Request, res: Response) => {
    const startedAt = Date.now();
    let databaseStatus: 'up' | 'down' = 'up';

    try {
      await prisma.user.findFirst({ select: { id: true } });
    } catch {
      databaseStatus = 'down';
    }

    const payload = {
      status: databaseStatus === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      responseTimeMs: Date.now() - startedAt,
    };

    return sendSuccess(res, payload, 'Service is healthy', databaseStatus === 'up' ? 200 : 503);
  }),
);

export default router;

import { Router } from 'express';
import healthRoutes from './health.routes';
import adminAuthRoutes from '@modules/auth/admin-auth.routes';
import { adminCategoryRouter, publicCategoryRouter } from '@modules/categories/category.routes';
import { adminAiToolRouter, publicAiToolRouter } from '@modules/ai-tools/ai-tool.routes';
import { adminTagRouter, publicTagRouter } from '@modules/tags/tag.routes';
import adminPromptRouter from '@modules/prompts/prompt.routes';
import publicPromptRoutes from '@modules/prompts/prompt-public.routes';
import { publicPromptController } from '@modules/prompts/prompt-public.controller';
import { mediaRouter } from '@modules/media/media.routes';
import favoriteRoutes from '@modules/favorites/favorite.routes';
import historyRoutes from '@modules/history/history.routes';
import { adminHomeSectionRouter, publicHomeRouter } from '@modules/home/home.routes';
import { publicAnalyticsRouter, adminAnalyticsRouter } from '@modules/analytics/analytics.routes';
import { adminAppConfigRouter, publicAppConfigRouter } from '@modules/app-config/app-config.routes';
import { adminAppVersionRouter, publicAppVersionRouter } from '@modules/app-version/app-version.routes';
import { adminAdConfigRouter, publicAdConfigRouter } from '@modules/ads/ad-config.routes';
import { adminDashboardRouter } from '@modules/admin-dashboard/dashboard.routes';
import { publicReportRouter, adminReportRouter } from '@modules/reports/report.routes';
import { adminAuditLogRouter } from '@modules/audit-logs/audit-log.routes';
import { adminAdminUserRouter } from '@modules/admin-users/admin-user.routes';
import { validate } from '@middleware/validate';
import { promptSearchQuerySchema } from '@validators/prompt.validator';

/**
 * Root router for /api/v1.
 *
 * Keeping this file as a pure aggregator (no business logic) is what
 * lets each module stay independent, per the required architecture.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/admin/auth', adminAuthRoutes);

// Admin — content management (Phase 4)
router.use('/admin/categories', adminCategoryRouter);
router.use('/admin/ai-tools', adminAiToolRouter);
router.use('/admin/tags', adminTagRouter);
router.use('/admin/prompts', adminPromptRouter); // includes nested /:promptId/media
router.use('/admin/media', mediaRouter); // standalone /:mediaId replace/delete

// Admin — home page sections (Phase 5)
router.use('/admin/home-sections', adminHomeSectionRouter);

// Admin — trending recalculation trigger (Phase 6)
router.use('/admin/analytics', adminAnalyticsRouter);

// Admin — remote configuration (Phase 7)
router.use('/admin/app-config', adminAppConfigRouter);
router.use('/admin/app-version', adminAppVersionRouter);

// Admin — ad management (Phase 8)
router.use('/admin/ads', adminAdConfigRouter);

// Admin — dashboard, reports, audit logs, admin-user management (Phase 9)
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/reports', adminReportRouter);
router.use('/admin/audit-logs', adminAuditLogRouter);
router.use('/admin/admin-users', adminAdminUserRouter);

// Public — reference data reads (Phase 4)
router.use('/categories', publicCategoryRouter);
router.use('/ai-tools', publicAiToolRouter);
router.use('/tags', publicTagRouter);

// Public — Flutter-facing APIs (Phase 5)
router.use('/home', publicHomeRouter);
router.use('/prompts', publicPromptRoutes); // includes /trending, /popular, /latest, /search, /:id, etc.
router.use('/favorites', favoriteRoutes);
router.use('/history', historyRoutes);
router.use('/analytics', publicAnalyticsRouter);

// Public — remote configuration (Phase 7): drives feature flags, video
// visibility, maintenance mode, and force/optional update prompts without
// a Flutter release (Section 59).
router.use('/app/config', publicAppConfigRouter);
router.use('/app/version', publicAppVersionRouter);

// Public — ad configuration (Phase 8; Section 25's literal example path).
router.use('/ads/config', publicAdConfigRouter);

// Public — content reports (Phase 9, Section 35).
router.use('/reports', publicReportRouter);

// Section 61 also lists a top-level /api/v1/search group — same handler as
// /prompts/search, exposed under both paths rather than duplicated.
router.get('/search', validate(promptSearchQuerySchema, 'query'), publicPromptController.search);

export default router;

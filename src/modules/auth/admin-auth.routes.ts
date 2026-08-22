import { Router } from 'express';
import { adminAuthController } from './admin-auth.controller';
import { validate } from '@middleware/validate';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { strictRateLimiter } from '@middleware/rateLimiter';
import {
  loginSchema,
  refreshSchema,
  registerAdminSchema,
  changePasswordSchema,
} from '@validators/admin-auth.validator';

const router = Router();

/**
 * @openapi
 * /api/v1/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful — returns admin profile + access/refresh tokens }
 *       401: { description: Invalid credentials }
 */
router.post('/login', strictRateLimiter, validate(loginSchema), adminAuthController.login);

/**
 * @openapi
 * /api/v1/admin/auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access/refresh token pair (rotates the refresh token)
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New token pair issued }
 *       401: { description: Refresh token invalid, expired, or revoked }
 */
router.post('/refresh', strictRateLimiter, validate(refreshSchema), adminAuthController.refresh);

/**
 * @openapi
 * /api/v1/admin/auth/logout:
 *   post:
 *     summary: Revoke a refresh token
 *     tags: [Admin Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Logged out (idempotent) }
 */
router.post('/logout', authenticate, validate(refreshSchema), adminAuthController.logout);

/**
 * @openapi
 * /api/v1/admin/auth/me:
 *   get:
 *     summary: Get the currently authenticated admin's profile
 *     tags: [Admin Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current admin profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, adminAuthController.me);

/**
 * @openapi
 * /api/v1/admin/auth/register-admin:
 *   post:
 *     summary: Create a new admin account (SUPER_ADMIN only)
 *     tags: [Admin Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               role: { type: string, enum: [SUPER_ADMIN, CONTENT_ADMIN, EDITOR, ANALYTICS] }
 *     responses:
 *       201: { description: Admin account created }
 *       403: { description: Requires SUPER_ADMIN role }
 *       409: { description: Email already in use }
 */
router.post(
  '/register-admin',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate(registerAdminSchema),
  adminAuthController.registerAdmin,
);

/**
 * @openapi
 * /api/v1/admin/auth/change-password:
 *   post:
 *     summary: Change the current admin's password (revokes all other sessions)
 *     tags: [Admin Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       401: { description: Current password incorrect }
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), adminAuthController.changePassword);

export default router;

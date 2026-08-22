import { AdminRole, AdminUser } from '@prisma/client';
import { adminRepository } from '@repositories/admin.repository';
import { hashPassword, verifyPassword } from '@utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@utils/jwt';
import { hashToken } from '@utils/hashToken';
import { parseDurationToMs } from '@utils/duration';
import { env } from '@config/env';
import { AuthenticationError, ConflictError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

/** Public-safe admin shape — never includes passwordHash. */
function sanitizeAdmin(admin: AdminUser) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
  };
}

async function issueTokenPair(admin: { id: string; email: string; role: AdminRole }) {
  const payload = { sub: admin.id, email: admin.email, role: admin.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  await adminRepository.createRefreshToken({
    adminId: admin.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export const adminAuthService = {
  async login(email: string, password: string, ipAddress?: string) {
    const admin = await adminRepository.findByEmail(email);
    // Same generic message whether the email doesn't exist or the password
    // is wrong — avoids leaking which admin emails are registered.
    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    const validPassword = await verifyPassword(admin.passwordHash, password);
    if (!validPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = await issueTokenPair(admin);
    await adminRepository.updateLastLogin(admin.id);
    await recordAuditLog({
      adminId: admin.id,
      action: AUDIT_ACTIONS.ADMIN_LOGIN,
      entityType: 'AdminUser',
      entityId: admin.id,
      ipAddress,
    });

    return { admin: sanitizeAdmin(admin), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await adminRepository.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.adminId !== payload.sub) {
      throw new AuthenticationError('Refresh token is invalid or has been revoked');
    }

    const admin = await adminRepository.findById(payload.sub);
    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Admin account is inactive or no longer exists');
    }

    // Rotate on every use: the presented token is immediately revoked and
    // replaced, so a leaked-but-unused refresh token has a single use window.
    await adminRepository.revokeRefreshToken(stored.id);
    const tokens = await issueTokenPair(admin);

    await recordAuditLog({
      adminId: admin.id,
      action: AUDIT_ACTIONS.ADMIN_REFRESH_TOKEN,
      entityType: 'AdminUser',
      entityId: admin.id,
    });

    return { admin: sanitizeAdmin(admin), ...tokens };
  },

  async logout(refreshToken: string, adminId?: string, ipAddress?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await adminRepository.findRefreshTokenByHash(tokenHash);

    // Idempotent: logging out with an already-invalid/unknown token is not an error.
    if (stored && !stored.revokedAt) {
      await adminRepository.revokeRefreshToken(stored.id);
    }

    await recordAuditLog({
      adminId: adminId ?? stored?.adminId,
      action: AUDIT_ACTIONS.ADMIN_LOGOUT,
      entityType: 'AdminUser',
      entityId: adminId ?? stored?.adminId,
      ipAddress,
    });
  },

  async getMe(adminId: string) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new AuthenticationError('Admin account no longer exists');
    }
    return sanitizeAdmin(admin);
  },

  async registerAdmin(
    input: { email: string; password: string; name: string; role: AdminRole },
    createdBy: { id: string; ipAddress?: string },
  ) {
    const existing = await adminRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An admin with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const admin = await adminRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
    });

    await recordAuditLog({
      adminId: createdBy.id,
      action: AUDIT_ACTIONS.ADMIN_CREATE,
      entityType: 'AdminUser',
      entityId: admin.id,
      metadata: { email: admin.email, role: admin.role },
      ipAddress: createdBy.ipAddress,
    });

    return sanitizeAdmin(admin);
  },

  async changePassword(adminId: string, currentPassword: string, newPassword: string, ipAddress?: string) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new AuthenticationError('Admin account no longer exists');
    }

    const validPassword = await verifyPassword(admin.passwordHash, currentPassword);
    if (!validPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await adminRepository.updatePassword(adminId, passwordHash);
    // Force re-login everywhere else after a password change.
    await adminRepository.revokeAllRefreshTokensForAdmin(adminId);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.ADMIN_CHANGE_PASSWORD,
      entityType: 'AdminUser',
      entityId: adminId,
      ipAddress,
    });
  },
};

export default adminAuthService;

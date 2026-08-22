import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AuditAction } from '@constants/adminActions';

interface RecordAuditLogInput {
  adminId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}

/**
 * Writes an audit log entry (Section 36). Best-effort by design: a failure
 * to write an audit record should never fail the admin action it's
 * describing, so errors are logged and swallowed rather than thrown.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as any) ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.warn({ err, input }, 'Failed to write audit log entry');
  }
}

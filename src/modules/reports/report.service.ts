import { ReportReason, ReportStatus } from '@prisma/client';
import { reportRepository } from './report.repository';
import { promptRepository } from '@modules/prompts/prompt.repository';
import { NotFoundError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

export const reportService = {
  async create(userId: string, input: { promptId: string; reason: ReportReason; description?: string }) {
    const exists = await promptRepository.existsById(input.promptId);
    if (!exists) throw new NotFoundError('promptId does not reference an existing prompt');

    return reportRepository.create({
      userId,
      promptId: input.promptId,
      reason: input.reason,
      description: input.description,
      status: 'PENDING',
    });
  },

  async list(params: { status?: ReportStatus; page: number; limit: number }) {
    return reportRepository.list(params);
  },

  async getById(id: string) {
    const report = await reportRepository.findById(id);
    if (!report) throw new NotFoundError('Report not found');
    return report;
  },

  /** Admin review workflow: PENDING -> REVIEWED/RESOLVED/DISMISSED (Section 35). */
  async updateStatus(id: string, status: ReportStatus, adminId: string, ipAddress?: string) {
    const existing = await reportRepository.findById(id);
    if (!existing) throw new NotFoundError('Report not found');

    const updated = await reportRepository.updateStatus(id, status, adminId);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_REPORT_STATUS,
      entityType: 'Report',
      entityId: id,
      metadata: { status },
      ipAddress,
    });

    return updated;
  },
};

export default reportService;

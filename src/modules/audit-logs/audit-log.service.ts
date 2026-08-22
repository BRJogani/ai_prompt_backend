import { auditLogRepository } from './audit-log.repository';

export const auditLogService = {
  async list(params: { action?: string; entityType?: string; adminId?: string; page: number; limit: number }) {
    return auditLogRepository.list(params);
  },
};

export default auditLogService;

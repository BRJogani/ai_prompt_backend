import { ActiveStatus, ContentType } from '@prisma/client';
import { aiToolRepository } from './ai-tool.repository';
import { slugify } from '@utils/slug';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

interface AiToolInput {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  websiteUrl?: string;
  contentTypes?: ContentType[];
  sortOrder?: number;
  status?: ActiveStatus;
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await aiToolRepository.findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const aiToolService = {
  async create(input: AiToolInput, adminId: string, ipAddress?: string) {
    const baseSlug = slugify(input.slug ?? input.name);
    if (!baseSlug) throw new ValidationError('A valid name or slug is required');
    const slug = await ensureUniqueSlug(baseSlug);

    const tool = await aiToolRepository.create({
      name: input.name,
      slug,
      description: input.description,
      iconUrl: input.iconUrl,
      websiteUrl: input.websiteUrl,
      contentTypes: input.contentTypes ?? [ContentType.BOTH],
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'ACTIVE',
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.CREATE_AI_TOOL,
      entityType: 'AiTool',
      entityId: tool.id,
      ipAddress,
    });

    return tool;
  },

  async update(id: string, input: Partial<AiToolInput>, adminId: string, ipAddress?: string) {
    const existing = await aiToolRepository.findById(id);
    if (!existing) throw new NotFoundError('AI tool not found');

    let slug = existing.slug;
    if (input.slug || input.name) {
      const baseSlug = slugify(input.slug ?? input.name ?? existing.name);
      slug = await ensureUniqueSlug(baseSlug, id);
    }

    const updated = await aiToolRepository.update(id, { ...input, slug });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AI_TOOL,
      entityType: 'AiTool',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async setStatus(id: string, status: ActiveStatus, adminId: string, ipAddress?: string) {
    const existing = await aiToolRepository.findById(id);
    if (!existing) throw new NotFoundError('AI tool not found');

    const updated = await aiToolRepository.update(id, { status });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AI_TOOL,
      entityType: 'AiTool',
      entityId: id,
      metadata: { status },
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await aiToolRepository.findById(id);
    if (!existing) throw new NotFoundError('AI tool not found');

    // Unlike categories, Prompt.aiTool uses onDelete: SetNull, so deleting
    // a tool that's in use is allowed — affected prompts simply lose their
    // tool association rather than being blocked or cascade-deleted.
    await aiToolRepository.delete(id);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DELETE_AI_TOOL,
      entityType: 'AiTool',
      entityId: id,
      ipAddress,
    });
  },

  async getById(id: string) {
    const tool = await aiToolRepository.findById(id);
    if (!tool) throw new NotFoundError('AI tool not found');
    return tool;
  },

  async list(params: { status?: ActiveStatus; page: number; limit: number }) {
    return aiToolRepository.list(params);
  },

  async listPublic() {
    return aiToolRepository.listAllActive();
  },
};

export default aiToolService;

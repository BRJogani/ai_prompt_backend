import { tagRepository } from './tag.repository';
import { slugify } from '@utils/slug';
import { ConflictError, NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';
import { prisma } from '@config/database';

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await tagRepository.findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const tagService = {
  async create(input: { name: string; slug?: string }, adminId: string, ipAddress?: string) {
    const baseSlug = slugify(input.slug ?? input.name);
    if (!baseSlug) throw new ValidationError('A valid name or slug is required');
    const slug = await ensureUniqueSlug(baseSlug);

    const tag = await tagRepository.create({ name: input.name, slug });

    await recordAuditLog({ adminId, action: AUDIT_ACTIONS.CREATE_TAG, entityType: 'Tag', entityId: tag.id, ipAddress });
    return tag;
  },

  async update(id: string, input: { name?: string; slug?: string }, adminId: string, ipAddress?: string) {
    const existing = await tagRepository.findById(id);
    if (!existing) throw new NotFoundError('Tag not found');

    let slug = existing.slug;
    if (input.slug || input.name) {
      const baseSlug = slugify(input.slug ?? input.name ?? existing.name);
      slug = await ensureUniqueSlug(baseSlug, id);
    }

    const updated = await tagRepository.update(id, { ...input, slug });
    await recordAuditLog({ adminId, action: AUDIT_ACTIONS.UPDATE_TAG, entityType: 'Tag', entityId: id, ipAddress });
    return updated;
  },

  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await tagRepository.findById(id);
    if (!existing) throw new NotFoundError('Tag not found');

    const usageCount = await prisma.promptTag.count({ where: { tagId: id } });
    if (usageCount > 0) {
      throw new ConflictError(`Cannot delete a tag attached to ${usageCount} prompt(s). Detach it first.`);
    }

    await tagRepository.delete(id);
    await recordAuditLog({ adminId, action: AUDIT_ACTIONS.DELETE_TAG, entityType: 'Tag', entityId: id, ipAddress });
  },

  async getById(id: string) {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new NotFoundError('Tag not found');
    return tag;
  },

  async list(params: { search?: string; page: number; limit: number }) {
    return tagRepository.list(params);
  },

  async listPublic() {
    return tagRepository.listAll();
  },

  /** Resolves tag names/slugs into Tag rows, creating any that don't yet exist. Used by the Prompt module. */
  async resolveOrCreateTags(tagSlugsOrNames: string[]) {
    const results = [];
    for (const raw of tagSlugsOrNames) {
      const slug = slugify(raw);
      if (!slug) continue;
      let tag = await tagRepository.findBySlug(slug);
      if (!tag) {
        tag = await tagRepository.create({ name: raw, slug });
      }
      results.push(tag);
    }
    return results;
  },
};

export default tagService;

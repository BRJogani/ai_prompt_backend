import { ContentType, PromptStatus } from '@prisma/client';
import { promptRepository } from './prompt.repository';
import { categoryRepository } from '@modules/categories/category.repository';
import { aiToolRepository } from '@modules/ai-tools/ai-tool.repository';
import { tagService } from '@modules/tags/tag.service';
import { slugify } from '@utils/slug';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

interface PromptInput {
  title: string;
  slug?: string;
  description?: string;
  promptText: string;
  categoryId: string;
  aiToolId?: string;
  contentType?: ContentType;
  status?: PromptStatus;
  sortOrder?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPremium?: boolean;
  videoEnabled?: boolean;
  tagSlugs?: string[];
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await promptRepository.findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new ValidationError('categoryId does not reference an existing category');
}

async function assertAiToolExists(aiToolId?: string): Promise<void> {
  if (!aiToolId) return;
  const tool = await aiToolRepository.findById(aiToolId);
  if (!tool) throw new ValidationError('aiToolId does not reference an existing AI tool');
}

export const promptService = {
  async create(input: PromptInput, adminId: string, ipAddress?: string) {
    await assertCategoryExists(input.categoryId);
    await assertAiToolExists(input.aiToolId);

    const baseSlug = slugify(input.slug ?? input.title);
    if (!baseSlug) throw new ValidationError('A valid title or slug is required');
    const slug = await ensureUniqueSlug(baseSlug);

    const tags = input.tagSlugs?.length ? await tagService.resolveOrCreateTags(input.tagSlugs) : [];

    const prompt = await promptRepository.create({
      title: input.title,
      slug,
      description: input.description,
      promptText: input.promptText,
      category: { connect: { id: input.categoryId } },
      ...(input.aiToolId ? { aiTool: { connect: { id: input.aiToolId } } } : {}),
      contentType: input.contentType ?? 'IMAGE',
      status: input.status ?? 'DRAFT',
      publishedAt: input.status === 'PUBLISHED' ? new Date() : undefined,
      sortOrder: input.sortOrder ?? 0,
      isFeatured: input.isFeatured ?? false,
      isTrending: input.isTrending ?? false,
      isPremium: input.isPremium ?? false,
      videoEnabled: input.videoEnabled ?? true,
      ...(tags.length ? { tags: { create: tags.map((tag) => ({ tagId: tag.id })) } } : {}),
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.CREATE_PROMPT,
      entityType: 'Prompt',
      entityId: prompt.id,
      ipAddress,
    });

    return prompt;
  },

  async update(id: string, input: Partial<PromptInput>, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    if (input.categoryId) await assertCategoryExists(input.categoryId);
    if (input.aiToolId) await assertAiToolExists(input.aiToolId);

    let slug = existing.slug;
    if (input.slug || input.title) {
      const baseSlug = slugify(input.slug ?? input.title ?? existing.title);
      slug = await ensureUniqueSlug(baseSlug, id);
    }

    if (input.tagSlugs) {
      const tags = await tagService.resolveOrCreateTags(input.tagSlugs);
      await promptRepository.replaceTags(
        id,
        tags.map((t) => t.id),
      );
    }

    const { tagSlugs: _tagSlugs, categoryId, aiToolId, ...rest } = input;

    const updated = await promptRepository.update(id, {
      ...rest,
      slug,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(aiToolId !== undefined
        ? aiToolId
          ? { aiTool: { connect: { id: aiToolId } } }
          : { aiTool: { disconnect: true } }
        : {}),
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  /**
   * Duplicates a prompt's content fields and tags into a new DRAFT.
   * Deliberately does NOT copy media — Cloudinary assets belong to the
   * original prompt's folder, so the duplicate starts empty and the admin
   * uploads fresh media before publishing it.
   */
  async duplicate(id: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const baseSlug = slugify(`${existing.title}-copy`);
    const slug = await ensureUniqueSlug(baseSlug);

    const duplicate = await promptRepository.create({
      title: `${existing.title} (Copy)`,
      slug,
      description: existing.description ?? undefined,
      promptText: existing.promptText,
      category: { connect: { id: existing.categoryId } },
      ...(existing.aiToolId ? { aiTool: { connect: { id: existing.aiToolId } } } : {}),
      contentType: existing.contentType,
      status: 'DRAFT',
      sortOrder: existing.sortOrder,
      isPremium: existing.isPremium,
      videoEnabled: existing.videoEnabled,
      ...(existing.tags.length ? { tags: { create: existing.tags.map((t) => ({ tagId: t.tagId })) } } : {}),
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DUPLICATE_PROMPT,
      entityType: 'Prompt',
      entityId: duplicate.id,
      metadata: { sourcePromptId: id },
      ipAddress,
    });

    return duplicate;
  },

  async publish(id: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    // A prompt with no media can't usefully appear in a visual-inspiration
    // feed — catch this before it goes live rather than shipping a blank card.
    if (existing.media.length === 0) {
      throw new ValidationError('Cannot publish a prompt with no media attached. Upload at least one image or video first.');
    }

    const updated = await promptRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: existing.publishedAt ?? new Date(),
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.PUBLISH_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async unpublish(id: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const updated = await promptRepository.update(id, { status: 'DRAFT' });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UNPUBLISH_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async archive(id: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const updated = await promptRepository.update(id, { status: 'ARCHIVED' });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.ARCHIVE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  /** Soft-delete (Section 43): flips to ARCHIVED and stamps deletedAt, preserving analytics/history. */
  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const updated = await promptRepository.update(id, { status: 'ARCHIVED', deletedAt: new Date() });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DELETE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async setFlags(id: string, flags: { isFeatured?: boolean; isTrending?: boolean; isPremium?: boolean }, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const updated = await promptRepository.update(id, flags);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      metadata: flags,
      ipAddress,
    });

    return updated;
  },

  async attachTags(id: string, tagSlugsOrNames: string[], adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    const tags = await tagService.resolveOrCreateTags(tagSlugsOrNames);
    await promptRepository.addTags(
      id,
      tags.map((tag) => tag.id),
    );

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      metadata: { attachedTags: tags.map((t) => t.slug) },
      ipAddress,
    });

    return promptRepository.findById(id);
  },

  async detachTag(id: string, tagId: string, adminId: string, ipAddress?: string) {
    const existing = await promptRepository.findById(id);
    if (!existing) throw new NotFoundError('Prompt not found');

    await promptRepository.removeTag(id, tagId);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_PROMPT,
      entityType: 'Prompt',
      entityId: id,
      metadata: { detachedTagId: tagId },
      ipAddress,
    });

    return promptRepository.findById(id);
  },

  async getById(id: string) {
    const prompt = await promptRepository.findById(id);
    if (!prompt) throw new NotFoundError('Prompt not found');
    return prompt;
  },

  async list(params: {
    status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
    categoryId?: string;
    aiToolId?: string;
    contentType?: ContentType;
    isFeatured?: boolean;
    isTrending?: boolean;
    isPremium?: boolean;
    search?: string;
    page: number;
    limit: number;
  }) {
    return promptRepository.list(params);
  },
};

export default promptService;

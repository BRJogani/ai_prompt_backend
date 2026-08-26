import { ActiveStatus } from '@prisma/client';
import { categoryRepository } from './category.repository';
import { slugify } from '@utils/slug';
import { ConflictError, NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';
import { findPublicPromptsWithVideoGate } from '@modules/prompts/prompt-visibility.service';
import { cloudinaryService } from '@services/cloudinary.service';

interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  coverImageUrl?: string;
  sortOrder?: number;
  isFeatured?: boolean;
  videoEnabled?: boolean;
  status?: ActiveStatus;
}

/** Appends `-2`, `-3`, ... until the slug is free. Category volume is small, so this loop is cheap. */
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await categoryRepository.findBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const categoryService = {
  async create(input: CategoryInput, adminId: string, ipAddress?: string) {
    const baseSlug = slugify(input.slug ?? input.name);
    if (!baseSlug) throw new ValidationError('A valid name or slug is required');
    const slug = await ensureUniqueSlug(baseSlug);

    const category = await categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
      iconUrl: input.iconUrl,
      coverImageUrl: input.coverImageUrl,
      sortOrder: input.sortOrder ?? 0,
      isFeatured: input.isFeatured ?? false,
      videoEnabled: input.videoEnabled ?? true,
      status: input.status ?? 'ACTIVE',
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.CREATE_CATEGORY,
      entityType: 'Category',
      entityId: category.id,
      ipAddress,
    });

    return category;
  },

  async update(id: string, input: Partial<CategoryInput>, adminId: string, ipAddress?: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    let slug = existing.slug;
    if (input.slug || input.name) {
      const baseSlug = slugify(input.slug ?? input.name ?? existing.name);
      slug = await ensureUniqueSlug(baseSlug, id);
    }

    const updated = await categoryRepository.update(id, { ...input, slug });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_CATEGORY,
      entityType: 'Category',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async setStatus(id: string, status: ActiveStatus, adminId: string, ipAddress?: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    const updated = await categoryRepository.update(id, { status });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_CATEGORY,
      entityType: 'Category',
      entityId: id,
      metadata: { status },
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    // Mirrors the DB-level onDelete: Restrict on Prompt.category — caught
    // here first so the admin gets a clear, actionable message instead of
    // a raw foreign-key-violation error.
    const promptCount = await categoryRepository.countPromptsInCategory(id);
    if (promptCount > 0) {
      throw new ConflictError(
        `Cannot delete a category with ${promptCount} prompt(s) assigned to it. Reassign or archive them first.`,
      );
    }

    await categoryRepository.delete(id);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DELETE_CATEGORY,
      entityType: 'Category',
      entityId: id,
      ipAddress,
    });
  },

  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  },

  async list(params: { status?: ActiveStatus; isFeatured?: boolean; page: number; limit: number }) {
    return categoryRepository.list(params);
  },

  async listPublic() {
    return categoryRepository.listAllActive();
  },

  /**
   * Upload an image for an existing category and update its coverImageUrl & iconUrl
   */
  async uploadImage(categoryId: string, file: Express.Multer.File, adminId: string, ipAddress?: string) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Category not found');
    if (!file) throw new ValidationError('No image file provided');

    const uploadResult = await cloudinaryService.uploadImage(file.buffer, 'categories', categoryId);
    const updated = await categoryRepository.update(categoryId, {
      coverImageUrl: uploadResult.secureUrl,
      iconUrl: uploadResult.thumbnailUrl,
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_CATEGORY,
      entityType: 'Category',
      entityId: categoryId,
      metadata: { action: 'upload_image', coverImageUrl: uploadResult.secureUrl },
      ipAddress,
    });

    return updated;
  },

  /**
   * Upload an image to Cloudinary categories folder directly (for new category drafting)
   */
  async uploadDirectImage(file: Express.Multer.File) {
    if (!file) throw new ValidationError('No image file provided');
    const uploadResult = await cloudinaryService.uploadImage(file.buffer, 'categories');
    return {
      secureUrl: uploadResult.secureUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
    };
  },

  /**
   * Published prompts belonging to a category, for the public
   * `GET /categories/:id/prompts` endpoint (Section 5). Routed through the
   * video-visibility gate (Phase 7) — same rule every other public prompt
   * listing enforces.
   */
  async getPublishedPromptsForCategory(categoryId: string, page: number, limit: number) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.status !== 'ACTIVE') {
      throw new NotFoundError('Category not found');
    }
    return findPublicPromptsWithVideoGate({ categoryId, page, limit });
  },
};

export default categoryService;

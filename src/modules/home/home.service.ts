import { ActiveStatus } from '@prisma/client';
import { homeSectionRepository } from './home-section.repository';
import { findPublicPromptsWithVideoGate } from '@modules/prompts/prompt-visibility.service';
import { categoryRepository } from '@modules/categories/category.repository';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

interface HomeSectionInput {
  title: string;
  sectionType: 'TRENDING' | 'LATEST' | 'POPULAR' | 'POPULAR_VIDEO' | 'POPULAR_IMAGE' | 'CATEGORY' | 'FEATURED';
  categoryId?: string;
  itemLimit?: number;
  sortOrder?: number;
}

export const homeSectionAdminService = {
  async create(input: HomeSectionInput, adminId: string, ipAddress?: string) {
    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) throw new ValidationError('categoryId does not reference an existing category');
    }

    const section = await homeSectionRepository.create({
      title: input.title,
      sectionType: input.sectionType,
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      itemLimit: input.itemLimit ?? 10,
      sortOrder: input.sortOrder ?? 0,
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.CREATE_HOME_SECTION,
      entityType: 'HomeSection',
      entityId: section.id,
      ipAddress,
    });

    return section;
  },

  async update(id: string, input: Partial<HomeSectionInput>, adminId: string, ipAddress?: string) {
    const existing = await homeSectionRepository.findById(id);
    if (!existing) throw new NotFoundError('Home section not found');

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) throw new ValidationError('categoryId does not reference an existing category');
    }

    const { categoryId, ...rest } = input;

    const updated = await homeSectionRepository.update(id, {
      ...rest,
      ...(categoryId !== undefined
        ? categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }
        : {}),
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_HOME_SECTION,
      entityType: 'HomeSection',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async setStatus(id: string, status: ActiveStatus, adminId: string, ipAddress?: string) {
    const existing = await homeSectionRepository.findById(id);
    if (!existing) throw new NotFoundError('Home section not found');

    const updated = await homeSectionRepository.update(id, { status });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_HOME_SECTION,
      entityType: 'HomeSection',
      entityId: id,
      metadata: { status },
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await homeSectionRepository.findById(id);
    if (!existing) throw new NotFoundError('Home section not found');

    await homeSectionRepository.delete(id);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DELETE_HOME_SECTION,
      entityType: 'HomeSection',
      entityId: id,
      ipAddress,
    });
  },

  async list() {
    return homeSectionRepository.listAll();
  },

  async getById(id: string) {
    const section = await homeSectionRepository.findById(id);
    if (!section) throw new NotFoundError('Home section not found');
    return section;
  },
};

/**
 * Resolves each active, admin-configured section into its actual prompt
 * list. This is what lets the admin reorder, rename, resize, or retarget
 * the home feed without a Flutter release (Section 15/59).
 */
export const homePublicService = {
  async getHome() {
    const sections = await homeSectionRepository.listActive();

    const resolved = await Promise.all(
      sections.map(async (section) => {
        const limit = section.itemLimit;
        let prompts;

        switch (section.sectionType) {
          case 'TRENDING':
            prompts = (await findPublicPromptsWithVideoGate({ page: 1, limit, sort: 'trending' })).items;
            break;
          case 'POPULAR':
            prompts = (await findPublicPromptsWithVideoGate({ page: 1, limit, sort: 'popular' })).items;
            break;
          case 'POPULAR_VIDEO':
            // If video is globally disabled, the gate's WHERE clause excludes
            // every VIDEO-only prompt, so this section naturally resolves to
            // an empty list rather than needing special-case handling here.
            prompts = (
              await findPublicPromptsWithVideoGate({ page: 1, limit, sort: 'popular', contentType: 'VIDEO' })
            ).items;
            break;
          case 'POPULAR_IMAGE':
            prompts = (
              await findPublicPromptsWithVideoGate({ page: 1, limit, sort: 'popular', contentType: 'IMAGE' })
            ).items;
            break;
          case 'FEATURED':
            prompts = (await findPublicPromptsWithVideoGate({ page: 1, limit, isFeatured: true, sort: 'latest' }))
              .items;
            break;
          case 'CATEGORY':
            prompts = section.categoryId
              ? (
                  await findPublicPromptsWithVideoGate({
                    page: 1,
                    limit,
                    categoryId: section.categoryId,
                    sort: 'latest',
                  })
                ).items
              : [];
            break;
          case 'LATEST':
          default:
            prompts = (await findPublicPromptsWithVideoGate({ page: 1, limit, sort: 'latest' })).items;
            break;
        }

        return {
          id: section.id,
          title: section.title,
          sectionType: section.sectionType,
          categoryId: section.categoryId,
          prompts,
        };
      }),
    );

    return resolved;
  },
};

export default { homeSectionAdminService, homePublicService };

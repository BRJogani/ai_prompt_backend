import { Prisma } from '@prisma/client';
import { promptRepository } from './prompt.repository';
import { appSettingService } from '@modules/app-config/app-setting.service';

const GLOBAL_VIDEO_FLAG_KEY = 'video_enabled';

export async function getGlobalVideoEnabled(): Promise<boolean> {
  return appSettingService.getBoolean(GLOBAL_VIDEO_FLAG_KEY, true);
}

/**
 * Pure implementation of the Section 16-18 visibility rule:
 *   Video Visible = global_video_enabled AND category_video_enabled AND prompt_video_enabled
 * (The fourth leg — "prompt has video" — is a data-shape fact, not a flag;
 * see `buildVideoVisibilityWhere` and `stripHiddenVideoMedia` for how that's
 * handled.) Exported standalone so all four cases from Section 53 can be
 * unit-tested without touching a database.
 */
export function isVideoVisible(
  globalVideoEnabled: boolean,
  categoryVideoEnabled: boolean,
  promptVideoEnabled: boolean,
): boolean {
  return globalVideoEnabled && categoryVideoEnabled && promptVideoEnabled;
}

/**
 * WHERE fragment that excludes VIDEO-only prompts when they wouldn't pass
 * the visibility chain — they have nothing else to show, so they must be
 * excluded from results entirely (not just have their media trimmed).
 * BOTH-type prompts are never excluded here since they still have image
 * content; see `stripHiddenVideoMedia` for those.
 */
export function buildVideoVisibilityWhere(globalVideoEnabled: boolean): Prisma.PromptWhereInput {
  if (!globalVideoEnabled) {
    // Global kill switch: no VIDEO-only prompt can ever qualify, regardless
    // of category/prompt-level flags.
    return { contentType: { not: 'VIDEO' } };
  }

  return {
    OR: [
      { contentType: { not: 'VIDEO' } },
      { AND: [{ contentType: 'VIDEO' }, { videoEnabled: true }, { category: { videoEnabled: true } }] },
    ],
  };
}

interface VisibilityCheckablePrompt {
  contentType: string;
  videoEnabled: boolean;
  category: { videoEnabled: boolean };
  media: Array<{ mediaType: string }>;
}

/**
 * Strips video media items from BOTH-type prompts that don't pass the
 * full visibility chain, without removing the prompt itself (it still has
 * image content). Never changes how many prompts are in the array — that's
 * `buildVideoVisibilityWhere`'s job — so pagination `total` counts stay
 * accurate even after this runs.
 */
export function stripHiddenVideoMedia<T extends VisibilityCheckablePrompt>(
  prompts: T[],
  globalVideoEnabled: boolean,
): T[] {
  return prompts.map((prompt) => {
    if (prompt.contentType !== 'BOTH') return prompt;
    if (isVideoVisible(globalVideoEnabled, prompt.category.videoEnabled, prompt.videoEnabled)) return prompt;
    return { ...prompt, media: prompt.media.filter((m) => m.mediaType !== 'VIDEO') };
  });
}

/**
 * The one entry point every public prompt list should use —
 * browse/trending/popular/latest/search (Phase 5), category detail
 * (Phase 4), and home sections (Phase 5) all route through this instead of
 * calling `promptRepository.findPublic` directly, so the visibility rule
 * is enforced in exactly one place.
 */
export async function findPublicPromptsWithVideoGate(
  params: Omit<Parameters<typeof promptRepository.findPublic>[0], 'extraWhere'>,
) {
  const globalVideoEnabled = await getGlobalVideoEnabled();
  const { items, total } = await promptRepository.findPublic({
    ...params,
    extraWhere: buildVideoVisibilityWhere(globalVideoEnabled),
  });
  return { items: stripHiddenVideoMedia(items, globalVideoEnabled), total };
}

/**
 * Same gate, single-prompt lookup. A direct link to a hidden VIDEO-only
 * prompt 404s — consistent with it being absent from every listing, per
 * Section 16's "Prompt details" being one of the surfaces video must be
 * hidden from.
 */
export async function findPublicPromptByIdWithVideoGate(id: string) {
  const globalVideoEnabled = await getGlobalVideoEnabled();
  const prompt = await promptRepository.findPublicById(id, buildVideoVisibilityWhere(globalVideoEnabled));
  if (!prompt) return null;
  return stripHiddenVideoMedia([prompt], globalVideoEnabled)[0];
}

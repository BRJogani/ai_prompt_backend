import { prisma } from '@config/database';
import { logger } from '@config/logger';

/** Score halves every this many days since publishedAt, so stale engagement fades and fresh content can rise. */
const HALF_LIFE_DAYS = 7;

interface ScoreInputs {
  viewCount: number;
  favoriteCount: number;
  copyCount: number;
  shareCount: number;
  publishedAt: Date | null;
}

/**
 * Raw engagement score (Section 14): views + favorites*3 + copies*2 +
 * shares*5, then multiplied by an exponential decay factor based on how
 * long ago the prompt was published. A prompt published today needs far
 * less raw engagement to outrank one from six months ago with a large but
 * stale lifetime total — that's the whole point of a *trending* score as
 * opposed to a plain popularity ranking (which `sort=popular` already covers).
 */
export function computeTrendingScore(inputs: ScoreInputs): number {
  if (!inputs.publishedAt) return 0;

  const rawScore = inputs.viewCount + inputs.favoriteCount * 3 + inputs.copyCount * 2 + inputs.shareCount * 5;
  const ageDays = (Date.now() - inputs.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, Math.max(ageDays, 0) / HALF_LIFE_DAYS);

  return rawScore * decayFactor;
}

/**
 * Recalculates and persists `trendingScore` for every published, non-deleted
 * prompt. Intended to run on a schedule (see `src/jobs/scheduler.ts`) and is
 * also exposed as a manual admin-triggered endpoint for immediate refresh.
 *
 * Updates are issued one prompt at a time rather than a single bulk SQL
 * statement — simplest to reason about and fine at this app's expected
 * catalog size. If the catalog grows into the tens of thousands, replace
 * the update loop with a single raw SQL UPDATE using the same formula.
 */
export async function recalculateTrendingScores(): Promise<{ updated: number; durationMs: number }> {
  const startedAt = Date.now();

  const prompts = await prisma.prompt.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: { id: true, viewCount: true, favoriteCount: true, copyCount: true, shareCount: true, publishedAt: true },
  });

  await Promise.all(
    prompts.map((prompt) =>
      prisma.prompt.update({
        where: { id: prompt.id },
        data: { trendingScore: computeTrendingScore(prompt) },
      }),
    ),
  );

  const durationMs = Date.now() - startedAt;
  logger.info({ updated: prompts.length, durationMs }, 'Trending scores recalculated');

  return { updated: prompts.length, durationMs };
}

export default recalculateTrendingScores;

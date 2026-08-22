import { logger } from '@config/logger';
import { env } from '@config/env';
import { recalculateTrendingScores } from './recalculateTrending.job';

let intervalHandle: NodeJS.Timeout | undefined;

/**
 * Starts the periodic trending recalculation job. Uses a plain
 * setInterval rather than a cron library — this app runs as a single
 * Render web service instance, so a full cron scheduler would be
 * unnecessary complexity. If this is ever deployed with multiple
 * instances, move this to a dedicated worker/cron service so it doesn't
 * run redundantly on every instance.
 */
export function startTrendingScheduler(): void {
  const intervalMs = env.TRENDING_RECALC_INTERVAL_MINUTES * 60 * 1000;

  // Run once shortly after boot (giving the DB connection time to settle),
  // then on the configured interval thereafter.
  setTimeout(() => {
    recalculateTrendingScores().catch((err) => logger.error({ err }, 'Initial trending recalculation failed'));
  }, 10_000).unref();

  intervalHandle = setInterval(() => {
    recalculateTrendingScores().catch((err) => logger.error({ err }, 'Scheduled trending recalculation failed'));
  }, intervalMs);
  intervalHandle.unref(); // don't keep the process alive solely for this timer

  logger.info(`🔁 Trending recalculation scheduled every ${env.TRENDING_RECALC_INTERVAL_MINUTES} minute(s)`);
}

export function stopTrendingScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = undefined;
  }
}

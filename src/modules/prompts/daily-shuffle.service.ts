import { prisma } from '@config/database';
import { Prisma } from '@prisma/client';
import { appSettingService } from '@modules/app-config/app-setting.service';

/**
 * 32-bit FNV-1a hash function for strings
 */
function fnv1a(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Mulberry32 32-bit PRNG generator
 * Given the same seed, produces the exact same sequence of random numbers across any device/platform.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates shuffle using Mulberry32
 */
export function deterministicShuffle<T>(array: T[], seedNumber: number): T[] {
  const result = [...array];
  const random = mulberry32(seedNumber);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

interface PromptIdentityHeader {
  id: string;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
}

// In-memory cache for ordered IDs with 2-minute TTL
interface CachedOrder {
  orderedIds: string[];
  expiresAt: number;
}
const orderCache = new Map<string, CachedOrder>();

export function clearDailyShuffleCache(): void {
  orderCache.clear();
}

/**
 * Helper to generate ISO 8601 Year-Week string (e.g. 2026-W37)
 */
export function getIsoYearWeek(d: Date): string {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Calculates the time interval seed key for synchronization across all devices
 */
export function getIntervalSeedKey(interval: string, date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  switch (interval.toUpperCase()) {
    case 'HOURLY':
      return `${year}-${month}-${day}T${hour}`;
    case 'WEEKLY':
      return getIsoYearWeek(date);
    case 'MONTHLY':
      return `${year}-${month}`;
    case 'DAILY':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Calculates or retrieves the deterministic synchronized ordered prompt IDs.
 * Flow:
 * 1. Top Pinned Section prompts (explicitly selected in Admin Panel) are placed FIRST,
 *    in the exact order selected by the admin.
 * 2. Additional Priority prompts (isFeatured: true OR sortOrder > 0) follow immediately.
 * 3. Standard prompts are either:
 *    - Shuffled using a deterministic PRNG seeded by the configured interval (Hourly/Daily/Weekly/Monthly) + salt.
 *    - Or sorted by createdAt descending if feed shuffling is turned OFF.
 * 4. All devices querying within the same interval receive the exact same synchronized order.
 */
export async function getDailyOrderedPromptIds(where: Prisma.PromptWhereInput): Promise<string[]> {
  const [shuffleConfig, topPinnedIds] = await Promise.all([
    appSettingService.getShuffleConfig().catch(() => ({ enabled: true, interval: 'DAILY' as const, salt: '' })),
    appSettingService.getTopPinnedPromptIds().catch(() => [] as string[]),
  ]);

  const intervalKey = getIntervalSeedKey(shuffleConfig.interval);
  const cacheKey = `${shuffleConfig.enabled}:${intervalKey}:${shuffleConfig.salt}:${JSON.stringify(topPinnedIds)}:${JSON.stringify(where)}`;
  const cached = orderCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.orderedIds;
  }

  // Query lightweight identification headers for all published matching prompts
  const records: PromptIdentityHeader[] = await prisma.prompt.findMany({
    where,
    select: {
      id: true,
      isFeatured: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  const recordMap = new Map(records.map((r) => [r.id, r]));

  // 1. Top pinned section: Match prompts in topPinnedIds in the exact configured sequence
  const topPinnedPrompts: PromptIdentityHeader[] = [];
  const topPinnedSet = new Set<string>();

  for (const id of topPinnedIds) {
    const item = recordMap.get(id);
    if (item && !topPinnedSet.has(id)) {
      topPinnedSet.add(id);
      topPinnedPrompts.push(item);
    }
  }

  // 2. Secondary priority prompts (isFeatured or sortOrder > 0, not already in topPinned)
  const priorityPrompts: PromptIdentityHeader[] = [];
  const standardPrompts: PromptIdentityHeader[] = [];

  for (const item of records) {
    if (topPinnedSet.has(item.id)) continue;

    if (item.isFeatured || (item.sortOrder != null && item.sortOrder > 0)) {
      priorityPrompts.push(item);
    } else {
      standardPrompts.push(item);
    }
  }

  priorityPrompts.sort((a, b) => {
    const orderA = a.sortOrder > 0 ? a.sortOrder : 999;
    const orderB = b.sortOrder > 0 ? b.sortOrder : 999;
    if (orderA !== orderB) return orderA - orderB;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // 3. Standard prompts: Shuffle if enabled, or preserve standard chronological order if disabled
  let orderedStandard: PromptIdentityHeader[];
  if (shuffleConfig.enabled) {
    const seedString = `${intervalKey}:${shuffleConfig.salt}:${JSON.stringify(where)}`;
    const seedNumber = fnv1a(seedString);
    orderedStandard = deterministicShuffle(standardPrompts, seedNumber);
  } else {
    orderedStandard = [...standardPrompts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const orderedIds = [
    ...topPinnedPrompts.map((p) => p.id),
    ...priorityPrompts.map((p) => p.id),
    ...orderedStandard.map((p) => p.id),
  ];

  // Store in cache for 2 minutes
  orderCache.set(cacheKey, {
    orderedIds,
    expiresAt: now + 2 * 60 * 1000,
  });

  return orderedIds;
}

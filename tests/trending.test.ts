import { computeTrendingScore } from '../src/jobs/recalculateTrending.job';

describe('computeTrendingScore', () => {
  it('returns 0 for a prompt with no publishedAt', () => {
    const score = computeTrendingScore({
      viewCount: 100,
      favoriteCount: 10,
      copyCount: 5,
      shareCount: 2,
      publishedAt: null,
    });
    expect(score).toBe(0);
  });

  it('weights favorites, copies, and shares per the Section 14 formula', () => {
    const now = new Date();
    const score = computeTrendingScore({
      viewCount: 100,
      favoriteCount: 10,
      copyCount: 5,
      shareCount: 2,
      publishedAt: now,
    });
    // raw = 100 + 10*3 + 5*2 + 2*5 = 150; decay ~= 1 at age 0
    expect(score).toBeCloseTo(150, 0);
  });

  it('decays roughly by half after one half-life (7 days)', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const freshScore = computeTrendingScore({
      viewCount: 100,
      favoriteCount: 0,
      copyCount: 0,
      shareCount: 0,
      publishedAt: now,
    });
    const staleScore = computeTrendingScore({
      viewCount: 100,
      favoriteCount: 0,
      copyCount: 0,
      shareCount: 0,
      publishedAt: sevenDaysAgo,
    });

    expect(staleScore).toBeCloseTo(freshScore / 2, 0);
  });

  it('never returns a negative score for future-dated publishedAt (clock skew safety)', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60);
    const score = computeTrendingScore({
      viewCount: 10,
      favoriteCount: 0,
      copyCount: 0,
      shareCount: 0,
      publishedAt: future,
    });
    expect(score).toBeGreaterThanOrEqual(10 * 0.999); // decay factor clamps to ~1, never > raw score
  });
});

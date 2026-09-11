import {
  deterministicShuffle,
  getIntervalSeedKey,
  getIsoYearWeek,
} from '../src/modules/prompts/daily-shuffle.service';

describe('Daily Deterministic Shuffling System', () => {
  const sampleItems = ['prompt_1', 'prompt_2', 'prompt_3', 'prompt_4', 'prompt_5', 'prompt_6', 'prompt_7', 'prompt_8'];

  it('produces identical output for identical seeds across multiple runs (All devices see same order)', () => {
    const seed = 123456789;
    const run1 = deterministicShuffle(sampleItems, seed);
    const run2 = deterministicShuffle(sampleItems, seed);
    const run3 = deterministicShuffle(sampleItems, seed);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
    // Preserves total count
    expect(run1).toHaveLength(sampleItems.length);
    // Contains all original items
    expect([...run1].sort()).toEqual([...sampleItems].sort());
  });

  it('produces a different shuffle order for a different day seed (Next day reshuffle)', () => {
    const day1Seed = 20260911;
    const day2Seed = 20260912;

    const day1Order = deterministicShuffle(sampleItems, day1Seed);
    const day2Order = deterministicShuffle(sampleItems, day2Seed);

    expect(day1Order).not.toEqual(day2Order);
    expect([...day1Order].sort()).toEqual([...day2Order].sort());
  });

  it('handles empty or single element arrays gracefully', () => {
    expect(deterministicShuffle([], 42)).toEqual([]);
    expect(deterministicShuffle(['single'], 42)).toEqual(['single']);
  });

  describe('Interval Seed Generation (Hourly, Daily, Weekly, Monthly)', () => {
    const testDate = new Date('2026-09-11T14:35:00Z');

    it('generates hourly seed formatted as YYYY-MM-DDTHH', () => {
      const key = getIntervalSeedKey('HOURLY', testDate);
      expect(key).toBe('2026-09-11T14');
    });

    it('generates daily seed formatted as YYYY-MM-DD', () => {
      const key = getIntervalSeedKey('DAILY', testDate);
      expect(key).toBe('2026-09-11');
    });

    it('generates weekly ISO week seed', () => {
      const key = getIntervalSeedKey('WEEKLY', testDate);
      expect(key).toBe('2026-W37');
      expect(getIsoYearWeek(testDate)).toBe('2026-W37');
    });

    it('generates monthly seed formatted as YYYY-MM', () => {
      const key = getIntervalSeedKey('MONTHLY', testDate);
      expect(key).toBe('2026-09');
    });

    it('produces different seeds across hours for HOURLY interval', () => {
      const hour1 = new Date('2026-09-11T10:00:00Z');
      const hour2 = new Date('2026-09-11T11:00:00Z');
      expect(getIntervalSeedKey('HOURLY', hour1)).not.toBe(getIntervalSeedKey('HOURLY', hour2));
    });

    it('produces identical seeds within the same month for MONTHLY interval', () => {
      const day1 = new Date('2026-09-01T00:00:00Z');
      const day15 = new Date('2026-09-15T12:00:00Z');
      expect(getIntervalSeedKey('MONTHLY', day1)).toBe(getIntervalSeedKey('MONTHLY', day15));
    });
  });
});

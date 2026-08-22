import {
  isVideoVisible,
  buildVideoVisibilityWhere,
  stripHiddenVideoMedia,
} from '../src/modules/prompts/prompt-visibility.service';

describe('isVideoVisible — Section 53 test matrix', () => {
  it('Case 1: global OFF, category ON, prompt ON -> NOT VISIBLE', () => {
    expect(isVideoVisible(false, true, true)).toBe(false);
  });

  it('Case 2: global ON, category OFF, prompt ON -> NOT VISIBLE', () => {
    expect(isVideoVisible(true, false, true)).toBe(false);
  });

  it('Case 3: global ON, category ON, prompt OFF -> NOT VISIBLE', () => {
    expect(isVideoVisible(true, true, false)).toBe(false);
  });

  it('Case 4: global ON, category ON, prompt ON -> VISIBLE', () => {
    expect(isVideoVisible(true, true, true)).toBe(true);
  });
});

describe('buildVideoVisibilityWhere', () => {
  it('excludes all VIDEO-only prompts when the global flag is off', () => {
    const where = buildVideoVisibilityWhere(false);
    expect(where).toEqual({ contentType: { not: 'VIDEO' } });
  });

  it('allows VIDEO-only prompts through an OR condition when the global flag is on', () => {
    const where = buildVideoVisibilityWhere(true) as any;
    expect(where.OR).toBeDefined();
    expect(where.OR[0]).toEqual({ contentType: { not: 'VIDEO' } });
  });
});

describe('stripHiddenVideoMedia', () => {
  const basePrompt = {
    contentType: 'BOTH',
    videoEnabled: true,
    category: { videoEnabled: true },
    media: [
      { mediaType: 'IMAGE', id: 'img1' },
      { mediaType: 'VIDEO', id: 'vid1' },
    ],
  };

  it('leaves BOTH-type prompt media untouched when fully visible', () => {
    const [result] = stripHiddenVideoMedia([basePrompt], true);
    expect(result.media).toHaveLength(2);
  });

  it('strips video media from a BOTH-type prompt when the global flag is off', () => {
    const [result] = stripHiddenVideoMedia([basePrompt], false);
    expect(result.media).toHaveLength(1);
    expect(result.media[0].mediaType).toBe('IMAGE');
  });

  it('strips video media from a BOTH-type prompt when the category disables video', () => {
    const prompt = { ...basePrompt, category: { videoEnabled: false } };
    const [result] = stripHiddenVideoMedia([prompt], true);
    expect(result.media).toHaveLength(1);
  });

  it('strips video media from a BOTH-type prompt when the prompt itself disables video', () => {
    const prompt = { ...basePrompt, videoEnabled: false };
    const [result] = stripHiddenVideoMedia([prompt], true);
    expect(result.media).toHaveLength(1);
  });

  it('never touches IMAGE-only or VIDEO-only prompts (they are handled by the WHERE clause, not here)', () => {
    const imagePrompt = { ...basePrompt, contentType: 'IMAGE' };
    const [result] = stripHiddenVideoMedia([imagePrompt], false);
    expect(result.media).toHaveLength(2); // unchanged — this function only acts on BOTH
  });

  it('never changes the number of prompts returned, only their media arrays', () => {
    const prompts = [basePrompt, { ...basePrompt, category: { videoEnabled: false } }];
    const result = stripHiddenVideoMedia(prompts, true);
    expect(result).toHaveLength(2);
  });
});

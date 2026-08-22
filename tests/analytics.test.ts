import request from 'supertest';

const users = new Map<string, any>();
const prompts = new Map<string, any>();
const events: any[] = [];

let userSeq = 0;
let eventSeq = 0;

jest.mock('@config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(users.get(where.uniqueId) ?? null)),
      create: jest.fn(({ data }: any) => {
        const user = { id: `user_${++userSeq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(user.uniqueId, user);
        return Promise.resolve(user);
      }),
      update: jest.fn(({ where, data }: any) => {
        const user = [...users.values()].find((u) => u.id === where.id);
        Object.assign(user, data);
        return Promise.resolve(user);
      }),
    },
    prompt: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(prompts.get(where.id) ?? null)),
      update: jest.fn(({ where, data }: any) => {
        const prompt = prompts.get(where.id);
        if (!prompt) return Promise.reject(new Error('not found'));
        if (data.viewCount?.increment) prompt.viewCount += data.viewCount.increment;
        if (data.copyCount?.increment) prompt.copyCount += data.copyCount.increment;
        if (data.shareCount?.increment) prompt.shareCount += data.shareCount.increment;
        return Promise.resolve(prompt);
      }),
    },
    analyticsEvent: {
      create: jest.fn(({ data }: any) => {
        const event = { id: `evt_${++eventSeq}`, createdAt: new Date(), ...data };
        events.push(event);
        return Promise.resolve(event);
      }),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

const app = createApp();
const deviceId = '550e8400-e29b-41d4-a716-446655440099';

beforeAll(() => {
  prompts.set('prompt_1', { id: 'prompt_1', viewCount: 0, copyCount: 0, shareCount: 0 });
});

describe('POST /api/v1/analytics/events', () => {
  it('rejects without X-Device-ID', async () => {
    const res = await request(app).post('/api/v1/analytics/events').send({ eventType: 'APP_OPEN' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid eventType', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'NOT_A_REAL_EVENT' });
    expect(res.status).toBe(400);
  });

  it('records an APP_OPEN event with no prompt reference', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'APP_OPEN' });
    expect(res.status).toBe(201);
  });

  it('404s when promptId does not reference an existing prompt', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'PROMPT_VIEW', promptId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(404);
  });

  it('increments viewCount on PROMPT_VIEW', async () => {
    const before = prompts.get('prompt_1').viewCount;
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'PROMPT_VIEW', promptId: 'prompt_1' });

    expect(res.status).toBe(201);
    expect(prompts.get('prompt_1').viewCount).toBe(before + 1);
  });

  it('increments copyCount on PROMPT_COPY and shareCount on PROMPT_SHARE', async () => {
    await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'PROMPT_COPY', promptId: 'prompt_1' });
    await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'PROMPT_SHARE', promptId: 'prompt_1' });

    expect(prompts.get('prompt_1').copyCount).toBe(1);
    expect(prompts.get('prompt_1').shareCount).toBe(1);
  });

  it('does NOT touch any counter for PROMPT_FAVORITE (owned by the Favorites module)', async () => {
    const before = { ...prompts.get('prompt_1') };
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('X-Device-ID', deviceId)
      .send({ eventType: 'PROMPT_FAVORITE', promptId: 'prompt_1' });

    expect(res.status).toBe(201);
    expect(prompts.get('prompt_1').viewCount).toBe(before.viewCount);
    expect(prompts.get('prompt_1').copyCount).toBe(before.copyCount);
    expect(prompts.get('prompt_1').shareCount).toBe(before.shareCount);
  });
});

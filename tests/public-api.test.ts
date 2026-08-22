import request from 'supertest';

const users = new Map<string, any>();
const prompts = new Map<string, any>();
const favorites = new Map<string, any>();
const history = new Map<string, any>();
const homeSections: any[] = [];

let userSeq = 0;
let favSeq = 0;

function favKey(userId: string, promptId: string) {
  return `${userId}:${promptId}`;
}

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
      findFirst: jest.fn(({ where }: any) => {
        const id = where?.id ?? where?.AND?.[0]?.id;
        const prompt = id ? prompts.get(id) : null;
        if (!prompt || prompt.status !== 'PUBLISHED' || prompt.deletedAt) return Promise.resolve(null);
        return Promise.resolve(prompt);
      }),
      findMany: jest.fn(() =>
        Promise.resolve([...prompts.values()].filter((p) => p.status === 'PUBLISHED' && !p.deletedAt)),
      ),
      count: jest.fn(() =>
        Promise.resolve([...prompts.values()].filter((p) => p.status === 'PUBLISHED' && !p.deletedAt).length),
      ),
      update: jest.fn(({ where }: any) => Promise.resolve(prompts.get(where.id))),
    },
    favorite: {
      findUnique: jest.fn(({ where }: any) =>
        Promise.resolve(favorites.get(favKey(where.userId_promptId.userId, where.userId_promptId.promptId)) ?? null),
      ),
      create: jest.fn(({ data }: any) => {
        const favorite = { id: `fav_${++favSeq}`, createdAt: new Date(), ...data };
        favorites.set(favKey(data.userId, data.promptId), favorite);
        return Promise.resolve(favorite);
      }),
      delete: jest.fn(({ where }: any) => {
        const key = favKey(where.userId_promptId.userId, where.userId_promptId.promptId);
        const favorite = favorites.get(key);
        favorites.delete(key);
        return Promise.resolve(favorite);
      }),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
    },
    history: {
      upsert: jest.fn(({ where, create }: any) => {
        const key = favKey(where.userId_promptId.userId, where.userId_promptId.promptId);
        const entry = { id: key, viewedAt: new Date(), ...create };
        history.set(key, entry);
        return Promise.resolve(entry);
      }),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    homeSection: {
      findMany: jest.fn(() => Promise.resolve(homeSections)),
    },
    appSetting: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.key === 'video_enabled') return Promise.resolve({ key: 'video_enabled', value: 'true', valueType: 'boolean' });
        return Promise.resolve(null);
      }),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

const app = createApp();

beforeAll(() => {
  prompts.set('prompt_1', {
    id: 'prompt_1',
    title: 'Cinematic Portrait',
    slug: 'cinematic-portrait',
    status: 'PUBLISHED',
    deletedAt: null,
    categoryId: 'cat_1',
    aiToolId: null,
    contentType: 'IMAGE',
    isFeatured: true,
    viewCount: 10,
    favoriteCount: 0,
    copyCount: 0,
    shareCount: 0,
    trendingScore: 5,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

describe('Device-scoped routes require X-Device-ID', () => {
  it('rejects favorites list without the header', async () => {
    const res = await request(app).get('/api/v1/favorites');
    expect(res.status).toBe(400);
  });

  it('rejects history list without the header', async () => {
    const res = await request(app).get('/api/v1/history');
    expect(res.status).toBe(400);
  });
});

describe('Favorites flow', () => {
  const deviceId = '550e8400-e29b-41d4-a716-446655440000';

  it('adds a prompt to favorites', async () => {
    const res = await request(app)
      .post('/api/v1/favorites')
      .set('X-Device-ID', deviceId)
      .send({ promptId: 'prompt_1' });

    expect(res.status).toBe(201);
  });

  it('rejects a duplicate favorite', async () => {
    const res = await request(app)
      .post('/api/v1/favorites')
      .set('X-Device-ID', deviceId)
      .send({ promptId: 'prompt_1' });

    expect(res.status).toBe(409);
  });

  it('removes a favorite', async () => {
    const res = await request(app).delete('/api/v1/favorites/prompt_1').set('X-Device-ID', deviceId);
    expect(res.status).toBe(200);
  });
});

describe('History flow', () => {
  const deviceId = '550e8400-e29b-41d4-a716-446655440001';

  it('records a view', async () => {
    const res = await request(app).post('/api/v1/history').set('X-Device-ID', deviceId).send({ promptId: 'prompt_1' });
    expect(res.status).toBe(201);
  });

  it('404s for a nonexistent prompt', async () => {
    const res = await request(app)
      .post('/api/v1/history')
      .set('X-Device-ID', deviceId)
      .send({ promptId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(404);
  });
});

describe('Public prompt browsing (no auth required)', () => {
  it('GET /api/v1/prompts/trending returns 200', async () => {
    const res = await request(app).get('/api/v1/prompts/trending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/prompts/search requires q', async () => {
    const res = await request(app).get('/api/v1/prompts/search');
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/prompts/search?q=cinematic returns 200', async () => {
    const res = await request(app).get('/api/v1/prompts/search?q=cinematic');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/search (top-level alias) returns 200', async () => {
    const res = await request(app).get('/api/v1/search?q=cinematic');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/home', () => {
  it('returns an empty sections array when no sections are configured', async () => {
    const res = await request(app).get('/api/v1/home');
    expect(res.status).toBe(200);
    expect(res.body.data.sections).toEqual([]);
  });
});

import request from 'supertest';
import argon2 from 'argon2';

const adminUsers = new Map<string, any>();
const refreshTokens = new Map<string, any>();
const categories = new Map<string, any>();

let categorySeq = 0;

jest.mock('@config/database', () => ({
  prisma: {
    adminUser: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.email) return Promise.resolve(adminUsers.get(where.email) ?? null);
        if (where.id) return Promise.resolve([...adminUsers.values()].find((a) => a.id === where.id) ?? null);
        return Promise.resolve(null);
      }),
      update: jest.fn(({ where, data }: any) => {
        const admin = [...adminUsers.values()].find((a) => a.id === where.id);
        Object.assign(admin, data);
        return Promise.resolve(admin);
      }),
    },
    adminRefreshToken: {
      create: jest.fn(({ data }: any) => {
        const token = { id: `rt_${refreshTokens.size + 1}`, revokedAt: null, createdAt: new Date(), ...data };
        refreshTokens.set(token.tokenHash, token);
        return Promise.resolve(token);
      }),
      findUnique: jest.fn(({ where }: any) => Promise.resolve(refreshTokens.get(where.tokenHash) ?? null)),
      update: jest.fn(({ where, data }: any) => {
        const token = [...refreshTokens.values()].find((t) => t.id === where.id);
        Object.assign(token, data);
        return Promise.resolve(token);
      }),
    },
    auditLog: {
      create: jest.fn(() => Promise.resolve({})),
    },
    category: {
      create: jest.fn(({ data }: any) => {
        const category = {
          id: `cat_${++categorySeq}`,
          status: 'ACTIVE',
          isFeatured: false,
          videoEnabled: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        categories.set(category.id, category);
        categories.set(`slug:${category.slug}`, category);
        return Promise.resolve(category);
      }),
      findUnique: jest.fn(({ where }: any) => {
        if (where.id) return Promise.resolve(categories.get(where.id) ?? null);
        if (where.slug) return Promise.resolve(categories.get(`slug:${where.slug}`) ?? null);
        return Promise.resolve(null);
      }),
      findMany: jest.fn(() =>
        Promise.resolve([...categories.values()].filter((c, i, arr) => arr.indexOf(c) === i && c.status === 'ACTIVE')),
      ),
      count: jest.fn(() => Promise.resolve(0)),
    },
    prompt: {
      count: jest.fn(() => Promise.resolve(0)),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

const app = createApp();
let accessToken: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash('CorrectHorseBattery1!');
  adminUsers.set('admin@example.com', {
    id: 'admin_seed',
    email: 'admin@example.com',
    passwordHash,
    name: 'Seed Admin',
    role: 'SUPER_ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const loginRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: 'admin@example.com', password: 'CorrectHorseBattery1!' });
  accessToken = loginRes.body.data.accessToken;
});

describe('Admin content routes require authentication', () => {
  it('rejects category list without a token', async () => {
    const res = await request(app).get('/api/v1/admin/categories');
    expect(res.status).toBe(401);
  });

  it('rejects prompt creation without a token', async () => {
    const res = await request(app).post('/api/v1/admin/prompts').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/admin/categories', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('creates a category and auto-generates a slug from the name', async () => {
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Cinematic Portraits' });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('cinematic-portraits');
    expect(res.body.data.name).toBe('Cinematic Portraits');
  });
});

describe('GET /api/v1/categories (public)', () => {
  it('returns the list of active categories without authentication', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

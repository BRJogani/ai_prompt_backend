import request from 'supertest';
import argon2 from 'argon2';

// In-memory fakes standing in for the Prisma-backed repository layer so
// this suite doesn't require a live PostgreSQL instance.
const adminUsers = new Map<string, any>();
const refreshTokens = new Map<string, any>();

jest.mock('@config/database', () => ({
  prisma: {
    adminUser: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.email) return Promise.resolve(adminUsers.get(where.email) ?? null);
        if (where.id) return Promise.resolve([...adminUsers.values()].find((a) => a.id === where.id) ?? null);
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }: any) => {
        const admin = {
          id: `admin_${adminUsers.size + 1}`,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        adminUsers.set(admin.email, admin);
        return Promise.resolve(admin);
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
      updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    auditLog: {
      create: jest.fn(() => Promise.resolve({})),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

const app = createApp();

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
});

describe('POST /api/v1/admin/auth/login', () => {
  it('returns 400 when the request body fails validation', async () => {
    const res = await request(app).post('/api/v1/admin/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a known email with the wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@example.com', password: 'totally-wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in successfully with correct credentials and returns a token pair', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@example.com', password: 'CorrectHorseBattery1!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.email).toBe('admin@example.com');
    expect(res.body.data.admin).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });
});

describe('GET /api/v1/admin/auth/me', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/v1/admin/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed bearer token', async () => {
    const res = await request(app).get('/api/v1/admin/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the admin profile with a valid access token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@example.com', password: 'CorrectHorseBattery1!' });

    const { accessToken } = loginRes.body.data;

    const meRes = await request(app).get('/api/v1/admin/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('admin@example.com');
  });
});

describe('POST /api/v1/admin/auth/register-admin', () => {
  it('is rejected without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/register-admin')
      .send({ email: 'new@example.com', password: 'password123', name: 'New Admin', role: 'EDITOR' });
    expect(res.status).toBe(401);
  });
});

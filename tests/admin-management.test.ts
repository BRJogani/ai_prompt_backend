import request from 'supertest';
import argon2 from 'argon2';

const adminUsers = new Map<string, any>();
const refreshTokens = new Map<string, any>();
const prompts = new Map<string, any>();
const reports = new Map<string, any>();
const users = new Map<string, any>();

let seq = 0;

jest.mock('@config/database', () => ({
  prisma: {
    adminUser: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.email) return Promise.resolve(adminUsers.get(where.email) ?? null);
        if (where.id) return Promise.resolve([...adminUsers.values()].find((a) => a.id === where.id) ?? null);
        return Promise.resolve(null);
      }),
      findMany: jest.fn(() => Promise.resolve([...adminUsers.values()])),
      count: jest.fn(() => Promise.resolve(adminUsers.size)),
      update: jest.fn(({ where, data }: any) => {
        const admin = [...adminUsers.values()].find((a) => a.id === where.id);
        Object.assign(admin, data);
        return Promise.resolve(admin);
      }),
      delete: jest.fn(({ where }: any) => {
        const admin = [...adminUsers.values()].find((a) => a.id === where.id);
        const emailKey = [...adminUsers.entries()].find(([, v]) => v.id === where.id)?.[0];
        if (emailKey) adminUsers.delete(emailKey);
        return Promise.resolve(admin);
      }),
    },
    adminRefreshToken: {
      create: jest.fn(({ data }: any) => {
        const token = { id: `rt_${++seq}`, revokedAt: null, createdAt: new Date(), ...data };
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
    auditLog: { create: jest.fn(() => Promise.resolve({})) },
    prompt: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(prompts.get(where.id) ?? null)),
    },
    report: {
      create: jest.fn(({ data }: any) => {
        const report = { id: `report_${++seq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        reports.set(report.id, report);
        return Promise.resolve(report);
      }),
      findUnique: jest.fn(({ where }: any) => Promise.resolve(reports.get(where.id) ?? null)),
      update: jest.fn(({ where, data }: any) => {
        const report = reports.get(where.id);
        Object.assign(report, data);
        return Promise.resolve(report);
      }),
    },
    user: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(users.get(where.uniqueId) ?? null)),
      create: jest.fn(({ data }: any) => {
        const user = { id: `user_${++seq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(user.uniqueId, user);
        return Promise.resolve(user);
      }),
      update: jest.fn(({ where, data }: any) => {
        const user = [...users.values()].find((u) => u.id === where.id);
        Object.assign(user, data);
        return Promise.resolve(user);
      }),
    },
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

const app = createApp();
let superAdminToken: string;
let superAdminId: string;
let otherAdminId: string;

beforeAll(async () => {
  const passwordHash = await argon2.hash('CorrectHorseBattery1!');
  adminUsers.set('super@example.com', {
    id: 'admin_super',
    email: 'super@example.com',
    passwordHash,
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  adminUsers.set('editor@example.com', {
    id: 'admin_editor',
    email: 'editor@example.com',
    passwordHash,
    name: 'Editor Admin',
    role: 'EDITOR',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  superAdminId = 'admin_super';
  otherAdminId = 'admin_editor';

  prompts.set('prompt_1', { id: 'prompt_1' });

  const loginRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: 'super@example.com', password: 'CorrectHorseBattery1!' });
  superAdminToken = loginRes.body.data.accessToken;
});

describe('Admin self-protection guards', () => {
  it('prevents an admin from deactivating their own account', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/admin-users/${superAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
  });

  it('prevents an admin from changing their own role', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/admin-users/${superAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'EDITOR' });

    expect(res.status).toBe(400);
  });

  it('prevents an admin from deleting their own account', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/admin-users/${superAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
  });

  it('allows updating a different admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/admin-users/${otherAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'CONTENT_ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('CONTENT_ADMIN');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('is restricted to SUPER_ADMIN only', async () => {
    const editorLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'editor@example.com', password: 'CorrectHorseBattery1!' });
    const editorToken = editorLogin.body.data.accessToken;

    const res = await request(app).get('/api/v1/admin/admin-users').set('Authorization', `Bearer ${editorToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Reports flow (Section 35)', () => {
  const deviceId = '550e8400-e29b-41d4-a716-446655440077';

  it('rejects a report for a nonexistent prompt', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('X-Device-ID', deviceId)
      .send({ promptId: '00000000-0000-0000-0000-000000000000', reason: 'INAPPROPRIATE' });

    expect(res.status).toBe(404);
  });

  it('submits a report for a real prompt', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('X-Device-ID', deviceId)
      .send({ promptId: 'prompt_1', reason: 'COPYRIGHT', description: 'Not their content' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('lets an admin update the report status', async () => {
    const reportId = [...reports.values()][0].id;
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESOLVED');
  });
});

describe('GET /api/v1/admin/dashboard requires authentication', () => {
  it('rejects without a token', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });
});

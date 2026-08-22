import request from 'supertest';
import argon2 from 'argon2';

const adminUsers = new Map<string, any>();
const refreshTokens = new Map<string, any>();
const appSettings = new Map<string, any>();
const appVersions = new Map<string, any>();

let userSeq = 0;

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
        const token = { id: `rt_${++userSeq}`, revokedAt: null, createdAt: new Date(), ...data };
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
    appSetting: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(appSettings.get(where.key) ?? null)),
      findMany: jest.fn(() => Promise.resolve([...appSettings.values()])),
      upsert: jest.fn(({ where, update, create }: any) => {
        const existing = appSettings.get(where.key);
        const value = existing ? { ...existing, ...update } : { ...create, createdAt: new Date(), updatedAt: new Date() };
        appSettings.set(where.key, value);
        return Promise.resolve(value);
      }),
    },
    appVersion: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(appVersions.get(where.platform) ?? null)),
      findMany: jest.fn(() => Promise.resolve([...appVersions.values()])),
      upsert: jest.fn(({ where, update, create }: any) => {
        const existing = appVersions.get(where.platform);
        const value = existing ? { ...existing, ...update } : { ...create, createdAt: new Date(), updatedAt: new Date() };
        appVersions.set(where.platform, value);
        return Promise.resolve(value);
      }),
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

  appSettings.set('video_enabled', { key: 'video_enabled', value: 'true', valueType: 'boolean' });
  appSettings.set('maintenance_mode', { key: 'maintenance_mode', value: 'false', valueType: 'boolean' });
  appSettings.set('support_email', { key: 'support_email', value: 'help@example.com', valueType: 'string' });

  appVersions.set('ANDROID', {
    platform: 'ANDROID',
    latestVersion: '2.0.0',
    minimumVersion: '1.5.0',
    forceUpdate: false,
    updateMessage: 'Please update',
    storeUrl: 'https://play.google.com/store',
    maintenanceMode: false,
  });

  const loginRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: 'admin@example.com', password: 'CorrectHorseBattery1!' });
  accessToken = loginRes.body.data.accessToken;
});

describe('GET /api/v1/app/config (public)', () => {
  it('returns the combined config with feature flags and maintenance info', async () => {
    const res = await request(app).get('/api/v1/app/config');
    expect(res.status).toBe(200);
    expect(res.body.data.featureFlags.videoEnabled).toBe(true);
    expect(res.body.data.maintenance.enabled).toBe(false);
    expect(res.body.data.supportEmail).toBe('help@example.com');
  });
});

describe('GET /api/v1/app/version (public)', () => {
  it('requires a platform query param', async () => {
    const res = await request(app).get('/api/v1/app/version');
    expect(res.status).toBe(400);
  });

  it('returns NONE when currentVersion is already latest', async () => {
    const res = await request(app).get('/api/v1/app/version?platform=ANDROID&currentVersion=2.0.0');
    expect(res.status).toBe(200);
    expect(res.body.data.updateRequired).toBe('NONE');
  });

  it('returns FORCE when currentVersion is below minimumVersion', async () => {
    const res = await request(app).get('/api/v1/app/version?platform=ANDROID&currentVersion=1.0.0');
    expect(res.status).toBe(200);
    expect(res.body.data.updateRequired).toBe('FORCE');
    expect(res.body.data.forceUpdate).toBe(true);
  });

  it('returns OPTIONAL when currentVersion is between minimum and latest', async () => {
    const res = await request(app).get('/api/v1/app/version?platform=ANDROID&currentVersion=1.7.0');
    expect(res.status).toBe(200);
    expect(res.body.data.updateRequired).toBe('OPTIONAL');
  });

  it('404s for a platform with no configured version', async () => {
    const res = await request(app).get('/api/v1/app/version?platform=IOS');
    expect(res.status).toBe(404);
  });
});

describe('Admin remote-config routes require authentication', () => {
  it('rejects app-config update without a token', async () => {
    const res = await request(app).patch('/api/v1/admin/app-config/video_enabled').send({ value: 'false' });
    expect(res.status).toBe(401);
  });

  it('rejects app-version update without a token', async () => {
    const res = await request(app)
      .put('/api/v1/admin/app-version/ANDROID')
      .send({ latestVersion: '2.1.0', minimumVersion: '1.5.0' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/admin/app-config/:key', () => {
  it('updates a setting value', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/app-config/video_enabled')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'false' });

    expect(res.status).toBe(200);
    expect(res.body.data.value).toBe('false');
  });

  it('404s for an unknown setting key', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/app-config/not_a_real_key')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ value: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/admin/app-version/:platform', () => {
  it('rejects latestVersion lower than minimumVersion', async () => {
    const res = await request(app)
      .put('/api/v1/admin/app-version/ANDROID')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ latestVersion: '1.0.0', minimumVersion: '2.0.0' });

    expect(res.status).toBe(400);
  });

  it('accepts a valid version update', async () => {
    const res = await request(app)
      .put('/api/v1/admin/app-version/ANDROID')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ latestVersion: '2.1.0', minimumVersion: '1.5.0' });

    expect(res.status).toBe(200);
    expect(res.body.data.latestVersion).toBe('2.1.0');
  });
});

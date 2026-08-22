import request from 'supertest';
import argon2 from 'argon2';

const adminUsers = new Map<string, any>();
const refreshTokens = new Map<string, any>();
const appSettings = new Map<string, any>();
const adConfigs = new Map<string, any>();

let adSeq = 0;
let tokenSeq = 0;

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
        const token = { id: `rt_${++tokenSeq}`, revokedAt: null, createdAt: new Date(), ...data };
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
    },
    adConfig: {
      create: jest.fn(({ data }: any) => {
        const config = { id: `ad_${++adSeq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        adConfigs.set(config.id, config);
        return Promise.resolve(config);
      }),
      findUnique: jest.fn(({ where }: any) => {
        if (where.id) return Promise.resolve(adConfigs.get(where.id) ?? null);
        if (where.adType_platform) {
          const { adType, platform } = where.adType_platform;
          return Promise.resolve(
            [...adConfigs.values()].find((c) => c.adType === adType && c.platform === platform) ?? null,
          );
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn(({ where }: any) => {
        let rows = [...adConfigs.values()];
        if (where?.OR) {
          rows = rows.filter((r) => where.OR.some((cond: any) => Object.entries(cond).every(([k, v]) => r[k] === v)));
        }
        return Promise.resolve(rows);
      }),
      update: jest.fn(({ where, data }: any) => {
        const config = adConfigs.get(where.id);
        Object.assign(config, data);
        return Promise.resolve(config);
      }),
      updateMany: jest.fn(({ data }: any) => {
        for (const config of adConfigs.values()) Object.assign(config, data);
        return Promise.resolve({ count: adConfigs.size });
      }),
      delete: jest.fn(({ where }: any) => {
        const config = adConfigs.get(where.id);
        adConfigs.delete(where.id);
        return Promise.resolve(config);
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

  appSettings.set('ads_enabled', { key: 'ads_enabled', value: 'true' });

  adConfigs.set('ad_seed_1', {
    id: 'ad_seed_1',
    adNetwork: 'ADMOB',
    adType: 'INTERSTITIAL',
    platform: 'ALL',
    adUnitId: 'ca-app-pub-all-interstitial',
    enabled: true,
    frequencyType: 'EVERY_N_ACTIONS',
    frequencyValue: 5,
    cooldownSeconds: 60,
    maxPerSession: 10,
    showOnHome: true,
    showOnPromptDetail: true,
    showOnCategory: true,
    showOnSearch: true,
    sortOrder: 0,
  });
  adConfigs.set('ad_seed_2', {
    id: 'ad_seed_2',
    adNetwork: 'ADMOB',
    adType: 'INTERSTITIAL',
    platform: 'ANDROID',
    adUnitId: 'ca-app-pub-android-interstitial',
    enabled: true,
    frequencyType: 'EVERY_N_ACTIONS',
    frequencyValue: 3,
    cooldownSeconds: 30,
    maxPerSession: 15,
    showOnHome: true,
    showOnPromptDetail: true,
    showOnCategory: true,
    showOnSearch: true,
    sortOrder: 0,
  });

  const loginRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: 'admin@example.com', password: 'CorrectHorseBattery1!' });
  accessToken = loginRes.body.data.accessToken;
});

describe('GET /api/v1/ads/config (public)', () => {
  it('requires a platform query param', async () => {
    const res = await request(app).get('/api/v1/ads/config');
    expect(res.status).toBe(400);
  });

  it('prefers the platform-specific row over the ALL fallback for the same ad type', async () => {
    const res = await request(app).get('/api/v1/ads/config?platform=ANDROID');
    expect(res.status).toBe(200);
    expect(res.body.data.ads.interstitial.adUnitId).toBe('ca-app-pub-android-interstitial');
    expect(res.body.data.ads.interstitial.frequencyValue).toBe(3);
  });

  it('falls back to the ALL row for a platform with no specific override', async () => {
    const res = await request(app).get('/api/v1/ads/config?platform=IOS');
    expect(res.status).toBe(200);
    expect(res.body.data.ads.interstitial.adUnitId).toBe('ca-app-pub-all-interstitial');
  });

  it('never exposes an ad type with no configured row as enabled', async () => {
    const res = await request(app).get('/api/v1/ads/config?platform=IOS');
    expect(res.body.data.ads.banner.enabled).toBe(false);
    expect(res.body.data.ads.banner.adUnitId).toBe('');
  });

  it('respects the master ads_enabled flag as an AND, not just the per-row flag', async () => {
    appSettings.set('ads_enabled', { key: 'ads_enabled', value: 'false' });
    const res = await request(app).get('/api/v1/ads/config?platform=ANDROID');
    expect(res.body.data.ads.interstitial.enabled).toBe(false); // row.enabled=true but master is off
    appSettings.set('ads_enabled', { key: 'ads_enabled', value: 'true' }); // restore for later tests
  });
});

describe('Admin ad config routes require authentication', () => {
  it('rejects list without a token', async () => {
    const res = await request(app).get('/api/v1/admin/ads');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/admin/ads', () => {
  it('rejects a duplicate adType/platform combination', async () => {
    const res = await request(app)
      .post('/api/v1/admin/ads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ adType: 'INTERSTITIAL', platform: 'ALL' });

    expect(res.status).toBe(409);
  });

  it('creates a new ad config for a not-yet-configured type/platform', async () => {
    const res = await request(app)
      .post('/api/v1/admin/ads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ adType: 'REWARDED', platform: 'IOS', adUnitId: 'ca-app-pub-ios-rewarded' });

    expect(res.status).toBe(201);
    expect(res.body.data.adUnitId).toBe('ca-app-pub-ios-rewarded');
    expect(res.body.data.enabled).toBe(false); // disabled by default
  });
});

describe('POST /api/v1/admin/ads/disable-all', () => {
  it('disables every ad config row', async () => {
    const res = await request(app)
      .post('/api/v1/admin/ads/disable-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const configRes = await request(app).get('/api/v1/ads/config?platform=ANDROID');
    expect(configRes.body.data.ads.interstitial.enabled).toBe(false);
  });
});

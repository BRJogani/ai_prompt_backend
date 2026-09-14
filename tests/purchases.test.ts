import request from 'supertest';
import { createApp } from '../src/app';

const users = new Map<string, any>();
const purchases = new Map<string, any>();

let userSeq = 0;
let purchaseSeq = 0;

jest.mock('@config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.uniqueId) return Promise.resolve(users.get(where.uniqueId) ?? null);
        if (where.id) return Promise.resolve([...users.values()].find((u) => u.id === where.id) ?? null);
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }: any) => {
        const user = { id: `user_${++userSeq}`, isPremium: false, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(user.uniqueId, user);
        return Promise.resolve(user);
      }),
      update: jest.fn(({ where, data }: any) => {
        const user = [...users.values()].find((u) => u.id === where.id);
        if (user) Object.assign(user, data);
        return Promise.resolve(user);
      }),
      count: jest.fn(({ where }: any) => {
        let list = [...users.values()];
        if (where?.isPremium !== undefined) {
          list = list.filter((u) => u.isPremium === where.isPremium);
        }
        return Promise.resolve(list.length);
      }),
    },
    purchase: {
      create: jest.fn(({ data }: any) => {
        const p = {
          id: `purch_${++purchaseSeq}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          purchaseDate: new Date(),
          ...data,
        };
        purchases.set(p.id, p);
        return Promise.resolve({
          ...p,
          user: [...users.values()].find((u) => u.id === data.userId) ?? null,
        });
      }),
      findFirst: jest.fn(({ where }: any) => {
        let list = [...purchases.values()];
        if (where.orderId) list = list.filter((p) => p.orderId === where.orderId);
        if (where.userId) list = list.filter((p) => p.userId === where.userId);
        return Promise.resolve(list[0] ?? null);
      }),
      findMany: jest.fn(({ where, skip = 0, take = 20 }: any) => {
        let list = [...purchases.values()];
        if (where?.platform) list = list.filter((p) => p.platform === where.platform);
        if (where?.status?.in) list = list.filter((p) => where.status.in.includes(p.status));
        else if (where?.status) list = list.filter((p) => p.status === where.status);
        if (where?.price) list = list.filter((p) => p.price !== null && p.price !== undefined);
        return Promise.resolve(
          list.slice(skip, skip + take).map((p) => ({
            ...p,
            user: [...users.values()].find((u) => u.id === p.userId) ?? null,
          })),
        );
      }),
      count: jest.fn((args: any = {}) => {
        const where = args?.where;
        let list = [...purchases.values()];
        if (where?.platform) list = list.filter((p) => p.platform === where.platform);
        if (where?.status?.in) list = list.filter((p) => where.status.in.includes(p.status));
        else if (where?.status) list = list.filter((p) => p.status === where.status);
        return Promise.resolve(list.length);
      }),
    },
    adminUser: {
      findUnique: jest.fn(() => Promise.resolve({ id: 'admin_1', email: 'admin@example.com', role: 'SUPER_ADMIN', isActive: true })),
      findById: jest.fn(() => Promise.resolve({ id: 'admin_1', email: 'admin@example.com', role: 'SUPER_ADMIN', isActive: true })),
    },
  },
}));

jest.mock('@repositories/admin.repository', () => ({
  adminRepository: {
    findById: jest.fn(() => Promise.resolve({ id: 'admin_1', email: 'admin@example.com', role: 'SUPER_ADMIN', isActive: true })),
  },
}));

jest.mock('@utils/jwt', () => ({
  verifyAccessToken: jest.fn(() => ({ sub: 'admin_1', email: 'admin@example.com', role: 'SUPER_ADMIN' })),
  generateAccessToken: jest.fn(() => 'mock-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh'),
}));

const app = createApp();

describe('In-App Purchases (SKU: ai_prompt) & Admin Panel Endpoints', () => {
  const deviceId = 'test-device-uuid-1234';

  beforeEach(() => {
    users.clear();
    purchases.clear();
    userSeq = 0;
    purchaseSeq = 0;
  });

  describe('Public Purchase Flow', () => {
    it('rejects purchase creation without X-Device-ID header', async () => {
      const res = await request(app)
        .post('/api/v1/purchases')
        .send({ productId: 'ai_prompt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('records a new purchase for SKU ai_prompt and marks user as premium', async () => {
      const res = await request(app)
        .post('/api/v1/purchases')
        .set('X-Device-ID', deviceId)
        .set('X-Platform', 'android')
        .send({
          productId: 'ai_prompt',
          orderId: 'GPA.1234-5678-9012',
          purchaseToken: 'token_abc123',
          platform: 'ANDROID',
          price: 4.99,
          currency: 'USD',
          status: 'COMPLETED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPremium).toBe(true);
      expect(res.body.data.purchase.productId).toBe('ai_prompt');
      expect(res.body.data.purchase.orderId).toBe('GPA.1234-5678-9012');
    });

    it('returns true for purchase status after purchase is recorded', async () => {
      // 1. Record purchase
      await request(app)
        .post('/api/v1/purchases')
        .set('X-Device-ID', deviceId)
        .send({
          productId: 'ai_prompt',
          orderId: 'GPA.1234-5678-9012',
          platform: 'ANDROID',
          price: 4.99,
          status: 'COMPLETED',
        });

      // 2. Query status
      const res = await request(app)
        .get('/api/v1/purchases/status')
        .set('X-Device-ID', deviceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPremium).toBe(true);
      expect(res.body.data.productId).toBe('ai_prompt');
    });
  });

  describe('Admin Purchase Management Endpoints', () => {
    it('blocks unauthenticated access to admin purchases', async () => {
      const res = await request(app).get('/api/v1/admin/purchases');
      expect(res.status).toBe(401);
    });

    it('returns purchases list and metrics for authenticated admins', async () => {
      // Seed a purchase
      await request(app)
        .post('/api/v1/purchases')
        .set('X-Device-ID', deviceId)
        .send({
          productId: 'ai_prompt',
          orderId: 'GPA.1111-2222',
          platform: 'ANDROID',
          price: 4.99,
        });

      const listRes = await request(app)
        .get('/api/v1/admin/purchases')
        .set('Authorization', 'Bearer mock-token');

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(Array.isArray(listRes.body.data)).toBe(true);

      const statsRes = await request(app)
        .get('/api/v1/admin/purchases/stats')
        .set('Authorization', 'Bearer mock-token');

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data).toHaveProperty('totalPurchases');
      expect(statsRes.body.data).toHaveProperty('totalRevenue');
    });
  });
});

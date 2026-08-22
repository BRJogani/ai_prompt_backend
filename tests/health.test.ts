import request from 'supertest';

// Mock the Prisma-backed database module so this test suite doesn't
// require a live PostgreSQL instance — it only verifies HTTP wiring.
jest.mock('@config/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({ id: 'user_1' }),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import { createApp } from '../src/app';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('returns 200 with a healthy payload when the database is reachable', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('up');
  });
});

describe('Unknown routes', () => {
  const app = createApp();

  it('returns a consistent 404 error shape', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Route not found'),
    });
  });
});

describe('Root endpoint', () => {
  const app = createApp();

  it('returns basic API metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBe('v1');
  });
});

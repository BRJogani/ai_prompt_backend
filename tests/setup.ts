process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/ai_prompt_app_test?directConnection=true';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-not-for-production-use';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-not-for-production-use';
process.env.LOG_LEVEL = 'silent';

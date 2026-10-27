process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'mongodb+srv://test:test@cluster0.imjifqz.mongodb.net/ai_prompt_app_test?retryWrites=true&w=majority&appName=Cluster0';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-not-for-production-use';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-not-for-production-use';
process.env.LOG_LEVEL = 'silent';

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * The app will refuse to boot if required variables are missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT (used from Phase 3 onward, validated now so .env stays consistent)
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters').default('dev-access-secret-change-me-please'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters').default('dev-refresh-secret-change-me-please'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Cloudinary (used from Phase 4 onward)
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Admin bootstrap (used by seed script)
  ADMIN_DEFAULT_EMAIL: z.string().email().optional().default('admin@example.com'),
  ADMIN_DEFAULT_PASSWORD: z.string().optional().default('ChangeMe123!'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Background jobs
  TRENDING_RECALC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
});

export type EnvConfig = z.infer<typeof envSchema>;

const DEV_DEFAULT_SECRETS = ['dev-access-secret-change-me-please', 'dev-refresh-secret-change-me-please'];

function loadEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  // Production safety net: the default secrets exist so `npm run dev` works
  // out of the box without a .env file, but shipping them to production
  // would mean anyone can forge admin JWTs. Refuse to boot rather than
  // silently running insecurely.
  if (parsed.data.NODE_ENV === 'production') {
    const usingDevSecret = DEV_DEFAULT_SECRETS.includes(parsed.data.JWT_ACCESS_SECRET) ||
      DEV_DEFAULT_SECRETS.includes(parsed.data.JWT_REFRESH_SECRET);
    if (usingDevSecret) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Refusing to start in production with the default JWT_ACCESS_SECRET/JWT_REFRESH_SECRET. ' +
          'Set real secrets (e.g. `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`) ' +
          'in your environment before deploying.',
      );
      process.exit(1);
    }
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

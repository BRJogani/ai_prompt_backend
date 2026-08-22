import { PrismaClient } from '@prisma/client';
import { isProduction } from './env';
import { logger } from './logger';

/**
 * Prisma Client singleton.
 *
 * In development, Node's module cache can be cleared by hot-reloaders,
 * which would otherwise spawn a new PrismaClient (and a new DB connection
 * pool) on every reload. We stash the instance on `global` to prevent that.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction
      ? [{ emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
  });

if (!isProduction) {
  global.__prisma = prisma;

  // @ts-expect-error - Prisma's event typings are awkward to narrow generically
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    logger.debug({ query: e.query, params: e.params, durationMs: e.duration }, 'prisma:query');
  });
}

// @ts-expect-error - see above
prisma.$on('error', (e: { message: string }) => {
  logger.error({ err: e.message }, 'prisma:error');
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('🔌 Database disconnected');
}

export default prisma;

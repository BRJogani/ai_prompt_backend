import 'dotenv/config';
import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { startTrendingScheduler, stopTrendingScheduler } from '@jobs/scheduler';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Health check: http://localhost:${env.PORT}/api/v1/health`);
    if (env.NODE_ENV === 'development') {
      logger.info(`   API docs:     http://localhost:${env.PORT}/api/docs`);
    }
  });

  startTrendingScheduler();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    stopTrendingScheduler();
    server.close(async () => {
      await disconnectDatabase();
      logger.info('👋 Shutdown complete');
      process.exit(0);
    });

    // Force-exit if shutdown hangs (e.g. a stuck connection)
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

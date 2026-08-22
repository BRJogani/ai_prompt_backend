import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from '@config/env';
import { requestLogger } from '@middleware/requestLogger';
import { globalRateLimiter } from '@middleware/rateLimiter';
import { errorHandler } from '@middleware/errorHandler';
import { notFoundHandler } from '@middleware/notFoundHandler';
import v1Router from '@routes/v1';
import { swaggerSpec } from '@config/swagger';

export function createApp(): Application {
  const app = express();

  // Required when running behind a reverse proxy (Render, Nginx, etc.)
  // so req.ip and rate limiting see the real client IP.
  app.set('trust proxy', 1);

  // ---- Security middleware -------------------------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary-hosted media to be embedded
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com', 'https://*'],
          connectSrc: ["'self'", 'http://localhost:*', 'https://*'],
        },
      },
    }),
  );

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: allowedOrigins.includes('*') ? true : allowedOrigins,
      credentials: true,
    }),
  );

  // ---- Body parsing & compression -------------------------------------------
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(compression());

  // ---- Logging ----------------------------------------------------------
  app.use(requestLogger);

  // ---- Admin Panel Web Application (SPA) -----------------------------------
  const adminPublicDir = path.join(process.cwd(), 'public', 'admin');
  app.use('/admin', express.static(adminPublicDir));
  app.get('/admin/*', (_req: Request, res: Response) => {
    res.sendFile(path.join(adminPublicDir, 'index.html'));
  });

  // ---- Rate limiting (applied to public API traffic) ------------------------
  app.use('/api', globalRateLimiter);

  // ---- API documentation --------------------------------------------------
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'AI Prompt Inspiration Platform &bull; Interactive API Docs',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 28px; color: #6366f1; }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'none',
      },
    }),
  );

  // ---- Root & versioned routes --------------------------------------------
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'AI Prompt Inspiration App API',
      version: 'v1',
      adminPanel: '/admin',
      docs: '/api/docs',
      openapiJson: '/api/docs.json',
    });
  });

  app.use('/api/v1', v1Router);

  // ---- 404 + centralized error handling -----------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;

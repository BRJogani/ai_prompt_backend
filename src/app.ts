import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { verifyAccessToken } from '@utils/jwt';
import { adminRepository } from '@repositories/admin.repository';
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

  // ---- Public Assets & Landing Page ---------------------------------------
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir, { index: false }));

  // ---- Admin Panel Web Application (SPA) -----------------------------------
  const adminPublicDir = path.join(process.cwd(), 'public', 'admin');
  app.use('/admin', express.static(adminPublicDir));
  app.get('/admin/*', (_req: Request, res: Response) => {
    res.sendFile(path.join(adminPublicDir, 'index.html'));
  });

  // ---- Rate limiting (applied to public API traffic) ------------------------
  app.use('/api', globalRateLimiter);

  // ---- API documentation protection (Admin login required) ---------------
  const requireDocsAuth = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    // 2. Check query parameter ?token=...
    if (!token && typeof req.query.token === 'string') {
      token = req.query.token.trim();
    }

    // 3. Check admin_token cookie
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      if (req.accepts('html')) {
        return res.redirect('/admin');
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin login required to access API documentation.',
      });
    }

    try {
      const payload = verifyAccessToken(token);
      const admin = await adminRepository.findById(payload.sub);
      if (!admin || !admin.isActive) {
        if (req.accepts('html')) return res.redirect('/admin');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Inactive or invalid admin account.',
        });
      }
      req.admin = { id: admin.id, email: admin.email, role: admin.role };
      next();
    } catch (_err) {
      if (req.accepts('html')) return res.redirect('/admin');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid or expired token.',
      });
    }
  };

  // ---- API documentation --------------------------------------------------
  app.get('/api/docs.json', requireDocsAuth, (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api/docs',
    requireDocsAuth,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Viral AI Photo Prompt Platform &bull; Interactive API Docs',
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
  app.get('/', (req: Request, res: Response) => {
    if (req.accepts(['json', 'html']) === 'html') {
      res.sendFile(path.join(publicDir, 'index.html'));
      return;
    }
    res.json({
      success: true,
      message: 'Viral AI Photo Prompt App API',
      version: 'v1',
    });
  });

  app.use('/api/v1', v1Router);

  // ---- 404 + centralized error handling -----------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;

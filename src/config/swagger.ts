import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Viral AI Photo Prompt Platform API',
    version: '1.0.0',
    description: `
## Complete REST API Documentation for Viral AI Photo Prompt Platform

This API powers the **Viral AI Photo Prompt Mobile App** (Flutter/iOS/Android) and the **Admin Control Panel**.

### Key Modules:
- **Public Client APIs**: Home feed sections, prompt catalog, trending ranking, search, device-scoped favorites & history, analytics event tracking, remote configuration (feature flags & ad unit placements), and app version force/optional updates.
- **Admin APIs**: Secure JWT-authenticated management for Prompts, Categories, AI Tools, Tags, Cloudinary Media Assets, Dynamic Home Sections, Ads CMS, Moderation Reports, Audit Logs, and Admin User management.

### Authentication & Headers:
- **Admin Endpoints**: Bearer Token in \`Authorization: Bearer <access_token>\` header.
- **Device-Scoped Public Endpoints**: Unique device identifier in \`X-Device-ID\` header (UUID / Client ID).
`,
    contact: {
      name: 'API Support',
      url: 'http://localhost:' + env.PORT + '/admin',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server',
    },
    {
      url: 'http://localhost:4000',
      description: 'Default Local Host',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health check and database connectivity' },
    { name: 'Admin Auth', description: 'Admin authentication, token refresh, profile, password management' },
    { name: 'Prompts (Public)', description: 'Public prompt feed, trending, search, and prompt details' },
    { name: 'Prompts (Admin)', description: 'Full CRUD management for AI prompt inspirations' },
    { name: 'Categories (Public)', description: 'Public category listings and category prompt feeds' },
    { name: 'Categories (Admin)', description: 'Category management and video policy configuration' },
    { name: 'AI Tools (Public)', description: 'Public AI generation platforms (Midjourney, ChatGPT, Veo, etc.)' },
    { name: 'AI Tools (Admin)', description: 'AI tools management and deep link configuration' },
    { name: 'Tags (Public)', description: 'Public prompt discovery tags and keywords' },
    { name: 'Tags (Admin)', description: 'Tags taxonomy management' },
    { name: 'Media (Admin)', description: 'Cloudinary signed upload signatures and media asset management' },
    { name: 'Home Sections (Public)', description: 'Dynamic home screen sections and banner feeds' },
    { name: 'Home Sections (Admin)', description: 'Home section arrangement and sort order curation' },
    { name: 'Favorites', description: 'Anonymous per-device saved prompt collection (requires X-Device-ID)' },
    { name: 'History', description: 'Anonymous per-device prompt view history (requires X-Device-ID)' },
    { name: 'Analytics & Events', description: 'Mobile client telemetry event tracking and trending recalculation' },
    { name: 'App Config (Remote Config)', description: 'Dynamic remote settings, feature flags, and maintenance mode' },
    { name: 'App Version & Updates', description: 'Platform-specific version checks (FORCE / OPTIONAL update)' },
    { name: 'Ads Config', description: 'Remote ad unit configuration (Banner, Interstitial, Rewarded, Native, App Open)' },
    { name: 'Dashboard Analytics', description: 'Admin analytics metrics, top leaderboards, and time-series data' },
    { name: 'Reports (Content Moderation)', description: 'Content reporting and safety moderation workflow' },
    { name: 'Audit Logs', description: 'Immutable administrative audit trail' },
    { name: 'Admin Users', description: 'SUPER_ADMIN control over administrator accounts and roles' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your admin access JWT token',
      },
      deviceId: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Device-ID',
        description: 'Anonymous device identifier (e.g. uuid-v4)',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found or validation error' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          errors: { type: 'array', items: { type: 'object' } },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 15 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0c' },
          name: { type: 'string', example: 'Cinematic' },
          slug: { type: 'string', example: 'cinematic' },
          description: { type: 'string', example: 'Cinematic lighting and movie scene aesthetics' },
          iconUrl: { type: 'string', nullable: true },
          coverImageUrl: { type: 'string', nullable: true },
          isFeatured: { type: 'boolean', example: true },
          videoEnabled: { type: 'boolean', example: true },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
          sortOrder: { type: 'integer', example: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PromptMedia: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0d' },
          mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'], example: 'IMAGE' },
          secureUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
          thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_400/sample.jpg' },
          width: { type: 'integer', example: 1024 },
          height: { type: 'integer', example: 1024 },
          duration: { type: 'number', nullable: true, example: 5.4 },
          format: { type: 'string', example: 'jpg' },
          sortOrder: { type: 'integer', example: 0 },
        },
      },
      Prompt: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0e' },
          title: { type: 'string', example: 'Cyberpunk Neon Street' },
          slug: { type: 'string', example: 'cyberpunk-neon-street' },
          promptText: { type: 'string', example: 'Cinematic neon street in Tokyo at night, rain reflections, 8k octane render' },
          description: { type: 'string', nullable: true },
          categoryId: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0c' },
          aiToolId: { type: 'string', nullable: true, example: '66c8f12a3b4c5d6e7f8a9b0f' },
          contentType: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'], example: 'IMAGE' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'REVIEW', 'ARCHIVED'], example: 'PUBLISHED' },
          isFeatured: { type: 'boolean', example: false },
          isTrending: { type: 'boolean', example: true },
          isPremium: { type: 'boolean', example: false },
          trendingScore: { type: 'number', example: 154.2 },
          viewCount: { type: 'integer', example: 1200 },
          favoriteCount: { type: 'integer', example: 340 },
          copyCount: { type: 'integer', example: 512 },
          shareCount: { type: 'integer', example: 98 },
          media: { type: 'array', items: { $ref: '#/components/schemas/PromptMedia' } },
          category: { $ref: '#/components/schemas/Category' },
          createdAt: { type: 'string', format: 'date-time' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AiTool: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0f' },
          name: { type: 'string', example: 'Midjourney' },
          slug: { type: 'string', example: 'midjourney' },
          description: { type: 'string', example: 'Leading generative AI art tool' },
          websiteUrl: { type: 'string', example: 'https://www.midjourney.com' },
          contentTypes: { type: 'array', items: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'] } },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
          sortOrder: { type: 'integer', example: 0 },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b10' },
          name: { type: 'string', example: 'Cinematic' },
          slug: { type: 'string', example: 'cinematic' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      HomeFeed: {
        type: 'object',
        properties: {
          sections: { type: 'array', items: { type: 'object' } },
          trending: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          newPrompts: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          latest: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          premium: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          free: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          featured: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
          mixed: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
        },
      },
      AdConfig: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b12' },
          adType: { type: 'string', enum: ['BANNER', 'INTERSTITIAL', 'REWARDED', 'NATIVE', 'APP_OPEN'], example: 'INTERSTITIAL' },
          platform: { type: 'string', enum: ['ALL', 'ANDROID', 'IOS'], example: 'ALL' },
          adUnitId: { type: 'string', example: 'ca-app-pub-3940256099942544/1033173712' },
          isEnabled: { type: 'boolean', example: true },
          frequencyType: { type: 'string', enum: ['EVERY_N_ACTIONS', 'ON_SCREEN_OPEN', 'MANUAL'], example: 'EVERY_N_ACTIONS' },
          frequencyValue: { type: 'integer', example: 5 },
          cooldownSeconds: { type: 'integer', example: 60 },
          maxPerSession: { type: 'integer', example: 10 },
        },
      },
      AppSetting: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b13' },
          key: { type: 'string', example: 'video_module_enabled' },
          value: { type: 'string', example: 'true' },
          valueType: { type: 'string', enum: ['STRING', 'BOOLEAN', 'NUMBER', 'JSON'], example: 'BOOLEAN' },
          description: { type: 'string', example: 'Master feature flag for video rendering' },
        },
      },
      AppVersion: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b14' },
          platform: { type: 'string', enum: ['ANDROID', 'IOS'], example: 'ANDROID' },
          latestVersion: { type: 'string', example: '1.2.0' },
          minimumVersion: { type: 'string', example: '1.0.0' },
          isForceUpdate: { type: 'boolean', example: false },
          storeUrl: { type: 'string', example: 'https://play.google.com/store/apps/details?id=com.example.promptapp' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b15' },
          promptId: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0e' },
          reason: { type: 'string', enum: ['INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'SPAM_OR_MISLEADING', 'HARASSMENT', 'OTHER'], example: 'INAPPROPRIATE_CONTENT' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'], example: 'PENDING' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b16' },
          adminId: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b17' },
          action: { type: 'string', example: 'CREATE_PROMPT' },
          entityType: { type: 'string', example: 'Prompt' },
          entityId: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0e' },
          ipAddress: { type: 'string', example: '127.0.0.1' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    // -----------------------------------------------------------------------
    // Health Check
    // -----------------------------------------------------------------------
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and database health status',
        responses: {
          200: {
            description: 'System is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        database: { type: 'string', example: 'connected' },
                        uptimeSeconds: { type: 'number', example: 124.5 },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Admin Auth
    // -----------------------------------------------------------------------
    '/api/v1/admin/auth/login': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Admin login and JWT token pair generation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@example.com' },
                  password: { type: 'string', format: 'password', example: 'SuperAdmin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        admin: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            role: { type: 'string', enum: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'ANALYTICS'] },
                          },
                        },
                        tokens: {
                          type: 'object',
                          properties: {
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                            expiresIn: { type: 'integer', example: 900 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/v1/admin/auth/refresh': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Refresh expired access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New token pair issued' },
          401: { description: 'Invalid or revoked refresh token' },
        },
      },
    },
    '/api/v1/admin/auth/me': {
      get: {
        tags: ['Admin Auth'],
        summary: 'Get current authenticated admin user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Admin profile returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/admin/auth/change-password': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Change current admin password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Public Prompts
    // -----------------------------------------------------------------------
    '/api/v1/prompts': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Browse published prompt inspirations',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'aiToolId', in: 'query', schema: { type: 'string' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'contentType', in: 'query', schema: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'] } },
          { name: 'isPremium', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'Paginated prompts catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/prompts/trending': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Get trending prompts with decay weighting',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'contentType', in: 'query', schema: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'] } },
        ],
        responses: {
          200: { description: 'Trending prompts sorted by score' },
        },
      },
    },
    '/api/v1/prompts/latest': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Get latest published prompts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Latest prompts' },
        },
      },
    },
    '/api/v1/prompts/new': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Alias for latest published prompts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'New prompts' },
        },
      },
    },
    '/api/v1/prompts/premium': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Get premium tier prompts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Premium prompts list' },
        },
      },
    },
    '/api/v1/prompts/free': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Get free tier prompts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Free prompts list' },
        },
      },
    },
    '/api/v1/prompts/search': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Search prompts by title, keywords, or text',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Matching prompts' },
        },
      },
    },
    '/api/v1/search': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Top-level search alias (equivalent to /api/v1/prompts/search)',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Search results' },
        },
      },
    },
    '/api/v1/prompts/{id}': {
      get: {
        tags: ['Prompts (Public)'],
        summary: 'Get public details of a single prompt by ID or Slug',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Prompt details with media, category, tool, and tags' },
          404: { description: 'Prompt not found or unpublished' },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Admin Prompts
    // -----------------------------------------------------------------------
    '/api/v1/admin/prompts': {
      get: {
        tags: ['Prompts (Admin)'],
        summary: 'Admin list all prompts with filters (Draft, Review, Published, Archived)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'REVIEW', 'ARCHIVED'] } },
        ],
        responses: {
          200: { description: 'Prompt list returned' },
        },
      },
      post: {
        tags: ['Prompts (Admin)'],
        summary: 'Create a new AI prompt inspiration',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'promptText', 'categoryId', 'contentType'],
                properties: {
                  title: { type: 'string', example: 'Cinematic Portrait' },
                  promptText: { type: 'string', example: 'Portrait of a warrior in golden hour light, 85mm f/1.4' },
                  categoryId: { type: 'string', example: '66c8f12a3b4c5d6e7f8a9b0c' },
                  contentType: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'], example: 'IMAGE' },
                  status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'REVIEW', 'ARCHIVED'], default: 'PUBLISHED' },
                  aiToolId: { type: 'string', nullable: true },
                  media: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['mediaType', 'secureUrl', 'cloudinaryPublicId'],
                      properties: {
                        mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
                        secureUrl: { type: 'string' },
                        thumbnailUrl: { type: 'string' },
                        cloudinaryPublicId: { type: 'string' },
                        format: { type: 'string' },
                        width: { type: 'integer' },
                        height: { type: 'integer' },
                        duration: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Prompt created successfully' },
        },
      },
    },
    '/api/v1/admin/prompts/{id}': {
      get: {
        tags: ['Prompts (Admin)'],
        summary: 'Get single prompt details for admin editing',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Prompt entity' } },
      },
      put: {
        tags: ['Prompts (Admin)'],
        summary: 'Update prompt inspiration details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  promptText: { type: 'string' },
                  categoryId: { type: 'string' },
                  contentType: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'] },
                  status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'REVIEW', 'ARCHIVED'] },
                  aiToolId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Prompt updated' } },
      },
      delete: {
        tags: ['Prompts (Admin)'],
        summary: 'Soft-delete a prompt (stamps deletedAt & status=ARCHIVED)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Prompt deleted' } },
      },
    },

    // -----------------------------------------------------------------------
    // Categories (Public & Admin)
    // -----------------------------------------------------------------------
    '/api/v1/categories': {
      get: {
        tags: ['Categories (Public)'],
        summary: 'Get all active public categories',
        responses: {
          200: {
            description: 'List of active categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/categories/{id}': {
      get: {
        tags: ['Categories (Public)'],
        summary: 'Get category by ID or slug',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Category entity' } },
      },
    },
    '/api/v1/categories/{id}/prompts': {
      get: {
        tags: ['Categories (Public)'],
        summary: 'Get paginated prompts belonging to a specific category',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
        ],
        responses: { 200: { description: 'Prompts in category' } },
      },
    },
    '/api/v1/admin/categories': {
      get: {
        tags: ['Categories (Admin)'],
        summary: 'Admin list categories with status and prompt counts',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Category list' } },
      },
      post: {
        tags: ['Categories (Admin)'],
        summary: 'Create a new category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: '3D Art' },
                  slug: { type: 'string', example: '3d-art' },
                  isFeatured: { type: 'boolean', default: false },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
                  videoEnabled: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Category created' } },
      },
    },
    '/api/v1/admin/categories/{id}': {
      put: {
        tags: ['Categories (Admin)'],
        summary: 'Update category details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  isFeatured: { type: 'boolean' },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Category updated' } },
      },
      delete: {
        tags: ['Categories (Admin)'],
        summary: 'Delete category (requires no assigned prompts)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Category deleted' }, 409: { description: 'Prompts still assigned to category' } },
      },
    },

    // -----------------------------------------------------------------------
    // AI Tools (Public & Admin)
    // -----------------------------------------------------------------------
    '/api/v1/ai-tools': {
      get: {
        tags: ['AI Tools (Public)'],
        summary: 'Get active AI generator platforms',
        responses: { 200: { description: 'Active AI tools list' } },
      },
    },
    '/api/v1/admin/ai-tools': {
      get: {
        tags: ['AI Tools (Admin)'],
        summary: 'Admin list all AI tools',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'All AI tools' } },
      },
      post: {
        tags: ['AI Tools (Admin)'],
        summary: 'Create a new AI Tool',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Flux AI' },
                  slug: { type: 'string', example: 'flux-ai' },
                  websiteUrl: { type: 'string', example: 'https://blackforestlabs.ai' },
                  description: { type: 'string' },
                  contentTypes: { type: 'array', items: { type: 'string', enum: ['IMAGE', 'VIDEO', 'BOTH'] } },
                  sortOrder: { type: 'integer', default: 0 },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'AI Tool created' } },
      },
    },
    '/api/v1/admin/ai-tools/{id}': {
      put: {
        tags: ['AI Tools (Admin)'],
        summary: 'Update AI tool configuration',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'AI tool updated' } },
      },
      delete: {
        tags: ['AI Tools (Admin)'],
        summary: 'Delete AI tool (prompts will have tool unlinked)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'AI tool deleted' } },
      },
    },

    // -----------------------------------------------------------------------
    // Tags (Public & Admin)
    // -----------------------------------------------------------------------
    '/api/v1/tags': {
      get: {
        tags: ['Tags (Public)'],
        summary: 'Get public tags list',
        responses: { 200: { description: 'Tags list' } },
      },
    },
    '/api/v1/admin/tags': {
      get: {
        tags: ['Tags (Admin)'],
        summary: 'Admin list tags',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Tags list' } },
      },
      post: {
        tags: ['Tags (Admin)'],
        summary: 'Create a new tag',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Cyberpunk' },
                  slug: { type: 'string', example: 'cyberpunk' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tag created' } },
      },
    },
    '/api/v1/admin/tags/{id}': {
      put: {
        tags: ['Tags (Admin)'],
        summary: 'Update tag name and slug',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Tag updated' } },
      },
      delete: {
        tags: ['Tags (Admin)'],
        summary: 'Delete tag',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Tag deleted' } },
      },
    },

    // -----------------------------------------------------------------------
    // Cloudinary Media Upload
    // -----------------------------------------------------------------------
    '/api/v1/admin/media/upload-signature': {
      post: {
        tags: ['Media (Admin)'],
        summary: 'Generate secure Cloudinary signed upload signature for direct browser/client upload',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['folder'],
                properties: {
                  folder: { type: 'string', example: 'ai-prompts/images' },
                  tags: { type: 'string', example: 'admin-upload' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Cloudinary credentials and signature returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    signature: { type: 'string' },
                    timestamp: { type: 'integer' },
                    apiKey: { type: 'string' },
                    cloudName: { type: 'string' },
                    folder: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Automated Home Feed (Public)
    // -----------------------------------------------------------------------
    '/api/v1/home': {
      get: {
        tags: ['Home Feed (Public)'],
        summary: 'Get automated mixed home screen feed (Trending, New, Premium, Free, Featured, Mixed Feed)',
        responses: {
          200: {
            description: 'Automated home feed with sections and direct category lists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        sections: { type: 'array', items: { type: 'object' } },
                        trending: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        newPrompts: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        latest: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        premium: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        free: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        featured: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                        mixed: { type: 'array', items: { $ref: '#/components/schemas/Prompt' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Favorites (Device-Scoped)
    // -----------------------------------------------------------------------
    '/api/v1/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Get saved favorite prompts for the caller device',
        security: [{ deviceId: [] }],
        parameters: [
          { name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Device favorites list' }, 400: { description: 'Missing X-Device-ID header' } },
      },
    },
    '/api/v1/favorites/{promptId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Add prompt to device favorites',
        security: [{ deviceId: [] }],
        parameters: [
          { name: 'promptId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Prompt added to favorites' } },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remove prompt from device favorites',
        security: [{ deviceId: [] }],
        parameters: [
          { name: 'promptId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Prompt removed from favorites' } },
      },
    },

    // -----------------------------------------------------------------------
    // History (Device-Scoped)
    // -----------------------------------------------------------------------
    '/api/v1/history': {
      get: {
        tags: ['History'],
        summary: 'Get recently viewed prompts for the caller device',
        security: [{ deviceId: [] }],
        parameters: [
          { name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Prompt view history' } },
      },
      delete: {
        tags: ['History'],
        summary: 'Clear all view history for the device',
        security: [{ deviceId: [] }],
        parameters: [{ name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'History cleared' } },
      },
    },
    '/api/v1/history/{promptId}': {
      post: {
        tags: ['History'],
        summary: 'Record prompt view in device history',
        security: [{ deviceId: [] }],
        parameters: [
          { name: 'promptId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'View recorded' } },
      },
    },

    // -----------------------------------------------------------------------
    // Analytics & Telemetry
    // -----------------------------------------------------------------------
    '/api/v1/analytics/events': {
      post: {
        tags: ['Analytics & Events'],
        summary: 'Ingest client telemetry events (APP_OPEN, PROMPT_VIEW, PROMPT_COPY, PROMPT_SHARE)',
        security: [{ deviceId: [] }],
        parameters: [{ name: 'X-Device-ID', in: 'header', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventType'],
                properties: {
                  eventType: { type: 'string', enum: ['APP_OPEN', 'PROMPT_VIEW', 'PROMPT_COPY', 'PROMPT_SHARE', 'SEARCH', 'PROMPT_FAVORITE', 'CATEGORY_VIEW'] },
                  promptId: { type: 'string', nullable: true },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Event tracked and prompt counters updated' } },
      },
    },
    '/api/v1/admin/analytics/recalculate-trending': {
      post: {
        tags: ['Analytics & Events'],
        summary: 'Trigger trending decay calculation job across all prompts',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Recalculation complete' } },
      },
    },

    // -----------------------------------------------------------------------
    // App Config & Versioning (Remote Config)
    // -----------------------------------------------------------------------
    '/api/v1/app/config': {
      get: {
        tags: ['App Config (Remote Config)'],
        summary: 'Get master remote configuration, feature flags, maintenance mode status, and video policies',
        responses: { 200: { description: 'Active remote config object' } },
      },
    },
    '/api/v1/app/version': {
      get: {
        tags: ['App Version & Updates'],
        summary: 'Check if caller mobile app requires update (FORCE, OPTIONAL, NONE)',
        parameters: [
          { name: 'platform', in: 'query', required: true, schema: { type: 'string', enum: ['ANDROID', 'IOS'] } },
          { name: 'version', in: 'query', schema: { type: 'string', example: '1.0.0' } },
        ],
        responses: {
          200: {
            description: 'Update evaluation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    updateType: { type: 'string', enum: ['FORCE', 'OPTIONAL', 'NONE'], example: 'NONE' },
                    latestVersion: { type: 'string', example: '1.2.0' },
                    minimumVersion: { type: 'string', example: '1.0.0' },
                    storeUrl: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/ads/config': {
      get: {
        tags: ['Ads Config'],
        summary: 'Get client ad unit configuration and frequency caps for platform',
        parameters: [
          { name: 'platform', in: 'query', required: true, schema: { type: 'string', enum: ['ANDROID', 'IOS'] } },
        ],
        responses: { 200: { description: 'Resolved ad configuration' } },
      },
    },

    // -----------------------------------------------------------------------
    // Admin Dashboard Analytics
    // -----------------------------------------------------------------------
    '/api/v1/admin/dashboard/overview': {
      get: {
        tags: ['Dashboard Analytics'],
        summary: 'Get high-level summary KPIs (total prompts, categories, copies, views, active devices)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'KPI summary statistics' } },
      },
    },
    '/api/v1/admin/dashboard/top-prompts': {
      get: {
        tags: ['Dashboard Analytics'],
        summary: 'Get top performing prompt leaderboard by copyCount, viewCount, or favoriteCount',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'metric', in: 'query', schema: { type: 'string', enum: ['copyCount', 'viewCount', 'favoriteCount', 'trendingScore'], default: 'copyCount' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Top prompts leaderboard' } },
      },
    },
    '/api/v1/admin/dashboard/top-categories': {
      get: {
        tags: ['Dashboard Analytics'],
        summary: 'Get most popular categories by prompt counts and total interaction views',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Top categories leaderboard' } },
      },
    },
    '/api/v1/admin/dashboard/timeseries': {
      get: {
        tags: ['Dashboard Analytics'],
        summary: 'Get aggregated time-series chart data for analytics graphing',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'range', in: 'query', schema: { type: 'string', enum: ['7d', '30d', '90d'], default: '30d' } },
          { name: 'eventType', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daily aggregated data points' } },
      },
    },

    // -----------------------------------------------------------------------
    // Reports (Content Moderation)
    // -----------------------------------------------------------------------
    '/api/v1/reports': {
      post: {
        tags: ['Reports (Content Moderation)'],
        summary: 'Submit a content safety violation report for a prompt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['promptId', 'reason'],
                properties: {
                  promptId: { type: 'string' },
                  reason: { type: 'string', enum: ['INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'SPAM_OR_MISLEADING', 'HARASSMENT', 'OTHER'] },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Report submitted for admin review' } },
      },
    },
    '/api/v1/admin/reports': {
      get: {
        tags: ['Reports (Content Moderation)'],
        summary: 'Admin list submitted moderation reports',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] } },
        ],
        responses: { 200: { description: 'Reports list' } },
      },
    },
    '/api/v1/admin/reports/{id}/status': {
      patch: {
        tags: ['Reports (Content Moderation)'],
        summary: 'Update moderation report status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Report status updated' } },
      },
    },

    // -----------------------------------------------------------------------
    // Audit Logs
    // -----------------------------------------------------------------------
    '/api/v1/admin/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get immutable audit log history of admin actions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Audit log entries' } },
      },
    },

    // -----------------------------------------------------------------------
    // Admin User Management (SUPER_ADMIN)
    // -----------------------------------------------------------------------
    '/api/v1/admin/admin-users': {
      get: {
        tags: ['Admin Users'],
        summary: 'List all registered admin accounts (SUPER_ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Admin user accounts' } },
      },
    },
    '/api/v1/admin/admin-users/{id}': {
      patch: {
        tags: ['Admin Users'],
        summary: 'Update admin account role or active status (SUPER_ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'ANALYTICS'] },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Admin updated' } },
      },
      delete: {
        tags: ['Admin Users'],
        summary: 'Delete admin account (Self-deletion prohibited)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Admin deleted' } },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [], // All endpoints are cleanly defined in the OpenAPI 3.0 specification above
});

export default swaggerSpec;


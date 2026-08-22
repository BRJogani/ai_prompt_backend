# AI Prompt Inspiration App — Backend

Production-ready REST API backend for a mobile app that lets users browse AI-generated
image/video inspiration, view/copy prompts, save favorites, and open external AI tools
(ChatGPT, Gemini, Midjourney, Veo, etc.). Users are anonymous — the Flutter app generates
a UUID per install instead of requiring login.

> **Status: Complete — all 10 phases implemented.** Anonymous device identity, full content
> CMS (categories/prompts/media/AI tools/tags), Cloudinary integration, public browsing/
> search/trending/home feed, favorites/history, analytics + trending recalculation, enforced
> video-visibility rules, remote config/feature flags/app version management, a complete ad
> configuration system, and an admin analytics/moderation dashboard. See "Project Status"
> near the end of this document for what's deliberately out of scope.

---

## Tech Stack

| Concern           | Choice                              |
|--------------------|--------------------------------------|
| Runtime            | Node.js 18+ / TypeScript (strict)   |
| Framework          | Express.js                          |
| Database           | PostgreSQL + Prisma ORM             |
| Validation         | Zod                                  |
| Auth               | JWT (access + refresh) + Argon2id   |
| Media              | Cloudinary                          |
| Logging            | Pino (+ pino-http)                  |
| Security           | Helmet, CORS, express-rate-limit    |
| Docs               | Swagger / OpenAPI (swagger-jsdoc)   |
| Testing            | Jest + Supertest, CI on every push  |
| Containerization   | Docker (multi-stage) + Compose      |
| Deployment target  | Render                              |

---

## Project Structure

```text
backend/
├── src/
│   ├── config/          # env, logger, prisma client, swagger
│   ├── controllers/     # (future phases) thin request handlers
│   ├── routes/
│   │   └── v1/          # versioned public API routes (/api/v1/*)
│   ├── services/        # (future phases) business logic
│   ├── repositories/    # (future phases) data access layer
│   ├── middleware/       # error handling, rate limiting, logging
│   ├── validators/      # (future phases) Zod schemas
│   ├── utils/           # ApiError, ApiResponse, catchAsync
│   ├── constants/       # (future phases)
│   ├── types/           # (future phases) shared TS types
│   ├── jobs/            # (future phases) scheduled/background jobs
│   ├── modules/         # (future phases) domain modules (auth, prompts, ads, ...)
│   ├── app.ts            # Express app assembly
│   └── server.ts         # Bootstrap + graceful shutdown
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
├── docs/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── package.json
├── tsconfig.json
└── README.md
```

Architecture rules followed throughout: no business logic in controllers, no
single giant file, everything modular and independently testable — see rule
set in the project brief (§62).

---

## 1. Prerequisites

- Node.js **>= 18**
- npm **>= 9**
- PostgreSQL **>= 14** (locally, via Docker, or a managed instance)
- Docker + Docker Compose (optional, for containerized local dev)

---

## 2. Installation

```bash
git clone <your-repo-url> backend
cd backend
npm install
```

## 3. Environment Setup

```bash
cp .env.example .env
```

Then edit `.env` and fill in real values, at minimum:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_prompt_app?schema=public
JWT_ACCESS_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate a different long random string>
```

Generate strong secrets, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. PostgreSQL Setup

**Option A — Docker (recommended for local dev):**

```bash
docker compose up -d postgres
```

**Option B — local install:** create a database matching your `DATABASE_URL`:

```bash
createdb ai_prompt_app
```

## 5. Prisma Setup

```bash
npm run prisma:generate      # generate the Prisma Client
npm run prisma:migrate:dev   # create & apply the initial migration
npm run prisma:seed          # optional: verify DB connectivity (Phase 1 seed)
```

## 6. Development

```bash
npm run dev
```

This starts the API with hot-reload (`tsx watch`) at:

- API root: `http://localhost:4000/`
- Health check: `http://localhost:4000/api/v1/health`
- Swagger docs (dev only): `http://localhost:4000/api/docs`

## 7. Production Build

```bash
npm run build     # compiles TypeScript to dist/ and rewrites path aliases
npm run start      # runs the compiled server (node dist/server.js)
```

The server always binds to `process.env.PORT` (never a hard-coded port).

## 8. Testing

```bash
npm test               # run the test suite once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

## 9. Linting & Formatting

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## Docker

Build and run the full stack (API + PostgreSQL) with Docker Compose:

```bash
docker compose up --build
```

The API container runs `prisma migrate deploy` on startup before launching the server.

Build the production image standalone:

```bash
docker build -t ai-prompt-app-api .
docker run -p 4000:4000 --env-file .env ai-prompt-app-api
```

---

## Render Deployment

A `render.yaml` **Blueprint** is included, provisioning a Node web service and a
managed PostgreSQL database:

1. Push this repository to GitHub/GitLab.
2. In the Render dashboard: **New → Blueprint**, point it at the repo.
3. Render reads `render.yaml` and provisions the web service + database automatically.
4. Set the `sync: false` secrets (Cloudinary credentials, admin bootstrap credentials)
   in the Render dashboard — they are intentionally excluded from the blueprint.
5. Build command: `npm ci && npx prisma generate && npm run build`
6. Start command: `npx prisma migrate deploy && npm run start`
7. Health check path: `/api/v1/health`

---

## API Conventions

- All public routes are versioned under **`/api/v1`**; admin routes under **`/api/v1/admin`**.
- Every response follows a consistent envelope:

  ```json
  { "success": true, "message": "Success", "data": {} }
  ```

  ```json
  { "success": false, "message": "Validation failed", "errors": [] }
  ```

- Anonymous users are identified via an `X-Device-ID` header (UUID generated client-side)
  — wired up starting in the Users module (Phase 4/5).
- Centralized error handling normalizes Zod, Prisma, and application errors into the
  response shape above; stack traces are never exposed in production.

---

## What's Implemented in Phase 1

- [x] TypeScript (strict mode) + path aliases (`@config/*`, `@utils/*`, etc.)
- [x] Express app factory (`createApp`) separate from the HTTP bootstrap (`server.ts`)
- [x] Zod-validated environment configuration (fails fast on misconfiguration)
- [x] Pino structured logging + per-request correlation IDs
- [x] Centralized error handling (`ApiError` hierarchy, Zod/Prisma error normalization)
- [x] Security middleware: Helmet, CORS (configurable origins), rate limiting
- [x] API versioning (`/api/v1`) with a clean router aggregation pattern
- [x] Health check endpoint (`/api/v1/health`) that verifies DB connectivity
- [x] Prisma + PostgreSQL wired up with a connection singleton
- [x] Swagger/OpenAPI scaffold (served at `/api/docs` in development)
- [x] Jest + Supertest test setup with a passing smoke test suite
- [x] Dockerfile (multi-stage, non-root user, healthcheck) + docker-compose.yml
- [x] `render.yaml` Blueprint for one-click Render deployment
- [x] `.env.example`, ESLint, Prettier

## What's Implemented in Phase 2 — Database

- [x] Full Prisma domain schema (`prisma/schema.prisma`) covering every module in the brief:
  - **Users** — anonymous, device-identified (`unique_id` from `X-Device-ID`), no PII
  - **Categories** — with per-category `video_enabled` control
  - **AI Tools** — with a `content_types` array (image/video/both)
  - **Tags** + explicit `PromptTag` join table
  - **Prompts** — full lifecycle (`DRAFT → REVIEW → PUBLISHED → ARCHIVED`), counters
    (`view_count`, `favorite_count`, `copy_count`, `share_count`), a stored `trending_score`,
    and a `deleted_at` column for soft-delete
  - **PromptMedia** — Cloudinary references only (no binary storage in Postgres)
  - **Favorites** — unique `(user_id, prompt_id)` constraint prevents duplicates at the DB level
  - **History** — unique `(user_id, prompt_id)` constraint so re-viewing upserts `viewed_at`
    instead of creating unlimited rows
  - **AnalyticsEvent** — full event taxonomy from §13, with `SetNull` FKs so deleting a
    prompt/category/user never destroys historical analytics
  - **HomeSection** — dynamic, admin-configurable home page sections
  - **AdConfig** — per ad-type/platform configuration, frequency/cooldown/session-limit fields,
    `ad_network` kept as a plain string (default `"ADMOB"`) so new networks don't need a migration
  - **AppSetting** — flexible key/value store serving both remote config *and* feature flags
  - **AppVersion** — per-platform force-update / maintenance-mode rows
  - **AdminUser** + **AdminRefreshToken** (revocable) + **AuditLog** — RBAC with 4 roles
  - **Report** — content-safety reporting workflow (`PENDING → REVIEWED/RESOLVED/DISMISSED`)
  - **NotificationToken** — schema ready for FCM, not yet wired to any endpoint
- [x] Indexes on every field called out in §41 (slugs, status, category/content-type filters,
  favorite/history lookups, analytics event queries), plus several composite indexes for
  the common query patterns (`status + contentType + publishedAt`, `status + categoryId`).
- [x] Cascade rules chosen deliberately, not left as Prisma defaults:
  - `Prompt.category` → `Restrict` (an admin must reassign/archive prompts before deleting a category)
  - `Prompt.aiTool`, `AnalyticsEvent.*`, `AuditLog.admin`, `Report.reviewedByAdmin` → `SetNull`
    (deleting the parent never silently deletes historical/analytics data)
  - `PromptMedia`, `PromptTag`, `Favorite`, `History` → `Cascade` (these are fully owned by
    their parent record and have no independent meaning once it's gone)
- [x] Seed script (`prisma/seed.ts`) populates: 1 super-admin, 6 categories, 5 AI tools,
  8 tags, 6 sample published prompts (with media + tags + realistic counters and a computed
  trending score), 7 home sections matching the example layout in §15, 14 default app
  settings/feature flags, 5 disabled-by-default ad configs, and 2 app version rows
  (Android/iOS). Deliberately does **not** seed `analytics_events`, `favorites`, or `history`
  — see §56.

### Generating the migration

This schema was authored directly (not generated by running `prisma migrate dev` against a
live database, since that requires a real PostgreSQL connection). To create the actual SQL
migration and apply it:

```bash
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
```

This will create `prisma/migrations/<timestamp>_init/migration.sql` and apply it, then run
the seed script. Verify everything landed correctly with:

```bash
npm run prisma:studio
```

which opens Prisma Studio (a local DB browser) at `http://localhost:5555`.

## What's Implemented in Phase 3 — Admin Authentication, Roles & Permissions

- [x] **JWT access + refresh token auth** (`src/modules/auth/`) — short-lived access tokens
  (`JWT_ACCESS_EXPIRES_IN`, default 15m) and longer-lived refresh tokens (`JWT_REFRESH_EXPIRES_IN`,
  default 30d), signed with separate secrets.
- [x] **Refresh tokens are persisted and rotated**, not just trusted as stateless JWTs:
  each refresh token is hashed (SHA-256) and stored in `AdminRefreshToken` with an expiry;
  every `/refresh` call revokes the presented token and issues a brand new pair, so a
  leaked-but-unused refresh token only works once. `/change-password` revokes *all* of an
  admin's outstanding refresh tokens, forcing re-login everywhere else.
- [x] **Argon2id password hashing** (`src/utils/password.ts`) — the OWASP-recommended variant.
- [x] **`authenticate` middleware** (`src/middleware/authenticate.ts`) — verifies the access
  token *and* re-checks the admin record in the database on every request, so a deactivated
  account or role change takes effect immediately rather than waiting for token expiry.
- [x] **`authorize(...roles)` middleware** (`src/middleware/authorize.ts`) — role allow-lists
  per route; `SUPER_ADMIN` always passes regardless of the listed roles, per §32.
- [x] **`ROLE_PERMISSIONS` map** (`src/constants/permissions.ts`) — a finer-grained
  resource-permission reference (`hasPermission(role, 'prompts:write')`) for future modules
  that need more than a simple role allow-list.
- [x] **Generic Zod `validate` middleware** (`src/middleware/validate.ts`) — reusable by every
  future module's routes.
- [x] **Audit logging** (`src/services/audit.service.ts`) — best-effort (never fails the
  parent request), used for `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `ADMIN_REFRESH_TOKEN`,
  `ADMIN_CREATE`, `ADMIN_CHANGE_PASSWORD`; action name constants for later phases
  (`CREATE_PROMPT`, `UPDATE_AD_CONFIG`, etc.) are pre-declared in `src/constants/adminActions.ts`.

### Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/admin/auth/login` | none (rate-limited) | Returns `{ admin, accessToken, refreshToken }` |
| POST | `/api/v1/admin/auth/refresh` | none (rate-limited) | Rotates the refresh token |
| POST | `/api/v1/admin/auth/logout` | Bearer | Revokes the given refresh token |
| GET | `/api/v1/admin/auth/me` | Bearer | Current admin profile |
| POST | `/api/v1/admin/auth/register-admin` | Bearer, `SUPER_ADMIN` only | Create another admin account |
| POST | `/api/v1/admin/auth/change-password` | Bearer | Revokes all other sessions |

Log in with the seed admin from Phase 2 (`ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD` in
your `.env`, defaults to `admin@example.com` / `ChangeMe123!`), then use the returned
`accessToken` as `Authorization: Bearer <token>` for protected routes.

## What's Implemented in Phase 4 — Content: Categories, Prompts, Media, Cloudinary, AI Tools, Tags

Five modules, all following the same layered pattern (`*.repository.ts` → `*.service.ts` →
`*.controller.ts` → `*.routes.ts`), built on the `authenticate`/`authorize`/`validate`
middleware from Phase 3.

- [x] **Categories** (`src/modules/categories/`) — full admin CRUD, enable/disable, slug
  auto-generation with uniqueness handling, delete guarded against categories that still
  have prompts assigned (mirrors the DB's `onDelete: Restrict`, but with a clear message
  instead of a raw FK error). Public reads: `GET /categories`, `GET /categories/:id`,
  `GET /categories/:id/prompts` (Section 5).
- [x] **AI Tools** (`src/modules/ai-tools/`) — same CRUD pattern. Deleting a tool in use is
  allowed (affected prompts just lose the association) since `Prompt.aiTool` is `SetNull`
  by design. Public reads: `GET /ai-tools`, `GET /ai-tools/:id`.
- [x] **Tags** (`src/modules/tags/`) — CRUD + a `resolveOrCreateTags()` helper (creates any
  tag that doesn't exist yet) reused by the Prompt module so admins can type free-form tags
  without a separate "create tag first" step. Delete is blocked while a tag is attached to
  any prompt. Public read: `GET /tags`.
- [x] **Prompts** (`src/modules/prompts/`) — the full lifecycle from Section 6: create, edit,
  **duplicate** (copies content + tags into a new DRAFT, deliberately *not* media — see
  inline comment), **publish** (blocked if the prompt has zero media attached),
  **unpublish**, **archive**, soft-**delete** (Section 43: flips to `ARCHIVED` + stamps
  `deletedAt`, analytics history is preserved), feature/trending flags, category/AI-tool
  reassignment, and tag attach/detach. Admin listing supports filtering by status, category,
  AI tool, content type, and a `search` param across title/description/promptText.
- [x] **Media + Cloudinary** (`src/modules/media/`, `src/services/cloudinary.service.ts`,
  `src/config/cloudinary.ts`) — upload/replace/delete backed by Cloudinary's
  `upload_stream` API (memory-buffered via Multer, never touches disk). Per Section 45:
  MIME type is validated *before* anything reaches Cloudinary, and image/video get separate
  size ceilings (10MB / 100MB) enforced in the service layer. **Replace** uploads the new
  asset before deleting the old one, so a failed upload never leaves a prompt without media.
  Thumbnails are auto-generated (video thumbnails pull the first frame). Reorder endpoint
  for managing a prompt's media sequence.

### Endpoints added this phase

| Area | Admin (auth required) | Public |
|---|---|---|
| Categories | `GET/POST /admin/categories`, `GET/PATCH/DELETE /admin/categories/:id`, `PATCH /admin/categories/:id/status` | `GET /categories`, `GET /categories/:id`, `GET /categories/:id/prompts` |
| AI Tools | `GET/POST /admin/ai-tools`, `GET/PATCH/DELETE /admin/ai-tools/:id`, `PATCH /admin/ai-tools/:id/status` | `GET /ai-tools`, `GET /ai-tools/:id` |
| Tags | `GET/POST /admin/tags`, `GET/PATCH/DELETE /admin/tags/:id` | `GET /tags` |
| Prompts | `GET/POST /admin/prompts`, `GET/PATCH/DELETE /admin/prompts/:id`, `POST /admin/prompts/:id/{duplicate,publish,unpublish,archive}`, `PATCH /admin/prompts/:id/flags`, `POST /admin/prompts/:id/tags`, `DELETE /admin/prompts/:id/tags/:tagId` | *(browsing/search/trending land in Phase 5)* |
| Media | `GET/POST /admin/prompts/:promptId/media`, `PATCH /admin/prompts/:promptId/media/reorder`, `PUT/DELETE /admin/media/:mediaId` | — |

All paths are relative to `/api/v1`. Write actions (create/edit) require `SUPER_ADMIN`,
`CONTENT_ADMIN`, or `EDITOR`; delete/publish/archive/status-toggle actions are restricted to
`SUPER_ADMIN`/`CONTENT_ADMIN` only, matching the EDITOR role's "create/edit content" scope
from Section 32.

### A note on scope

Per the phased plan (Section 64), **public prompt browsing (search, trending, popular,
home feed) is Phase 5's job**, not this one — this phase deliberately stops at giving admins
full content-management tools plus the minimal public reads that Section 5 explicitly calls
for on Categories. `promptRepository.findPublished()` already exists as the shared
foundation Phase 5 will build sorting/search/pagination on top of, so there's no rework
ahead — just additive filters.

Video-visibility gating (global → category → prompt AND logic, Sections 16–18) is *modeled*
in the schema now but not yet *enforced* in any query — that wiring is Phase 7's job
(Remote configuration), once the `AppSetting` read path exists to check the global flag.

## What's Implemented in Phase 5 — Flutter APIs: Home, Categories, Prompts, Search, Favorites, History

- [x] **Anonymous device users** (`src/modules/users/`, `src/middleware/resolveDeviceUser.ts`)
  — every device-scoped route requires an `X-Device-ID` header (the UUID the Flutter app
  generates once per install, per Section 4). The `resolveDeviceUser` middleware
  transparently creates the `User` row on first sight and touches `lastActiveAt` on every
  call; optional `X-Platform` / `X-App-Version` / `X-Device-Model` / `X-OS-Version` headers
  enrich the record but are never required. No registration, no PII.
- [x] **Public prompt browsing** (`src/modules/prompts/prompt-public.*`) — `GET /prompts`
  (generic browse with `sort`/`categoryId`/`aiToolId`/`contentType` filters),
  `GET /prompts/trending`, `/popular`, `/latest`, `/popular-videos`, `/popular-images`,
  `/featured`, `/search?q=`, and `GET /prompts/:id`. All nine of these are one repository
  method (`promptRepository.findPublic`) with a different sort/filter preset — not separate
  queries — exactly as promised when Phase 4 built the foundation. Sorting per Section 31:
  `latest`, `trending` (stored `trendingScore`), `popular`/`most_viewed`, `most_favorited`,
  `most_copied`.
- [x] **Search** (Section 29) — `GET /prompts/search?q=` searches title, description,
  prompt text, and tag names. Also exposed at the top-level `GET /search?q=` (Section 61's
  API group) as the exact same handler, not a duplicate implementation.
- [x] **Favorites** (`src/modules/favorites/`) — `POST /favorites`, `DELETE /favorites/:promptId`,
  `GET /favorites`. Add/remove and the `Prompt.favoriteCount` counter update **in the same
  transaction**, so the denormalized count used for `most_favorited` sorting can never drift
  from the actual number of `Favorite` rows. The DB's `@@unique([userId, promptId])`
  backstops duplicate prevention even under a race.
- [x] **History** (`src/modules/history/`) — `POST /history` (upserts — re-viewing a prompt
  updates `viewedAt` instead of piling up duplicate rows, per Section 12),
  `GET /history`, `DELETE /history` (clears everything, or just one entry via
  `?promptId=`).
- [x] **Home** (`src/modules/home/`) — `GET /home` resolves every `ACTIVE` `HomeSection` (in
  admin-configured order) into its actual prompt list. Admin CRUD at
  `/admin/home-sections` lets the admin add/reorder/rename/resize/retarget sections without
  a Flutter release (Section 59) — `CATEGORY` sections require a `categoryId`, enforced by
  the validator.

### Endpoints added this phase

| Area | Public | Admin |
|---|---|---|
| Prompts | `GET /prompts`, `/trending`, `/popular`, `/latest`, `/popular-videos`, `/popular-images`, `/featured`, `/search`, `/:id` | *(unchanged from Phase 4)* |
| Search | `GET /search` (alias of `/prompts/search`) | — |
| Favorites | `GET/POST /favorites`, `DELETE /favorites/:promptId` | — |
| History | `GET/POST /history`, `DELETE /history` | — |
| Home | `GET /home` | `GET/POST /admin/home-sections`, `GET/PATCH/DELETE /admin/home-sections/:id`, `PATCH /admin/home-sections/:id/status` |

All paths relative to `/api/v1`. Favorites/History require `X-Device-ID`; everything else
in this table is unauthenticated.

### A note on scope (still holding the line from Phase 4)

**Video-visibility gating is still not enforced** — `promptRepository.findPublic` doesn't
yet check `AppSetting['video_enabled']` × `Category.videoEnabled` × `Prompt.videoEnabled`.
That wiring depends on the remote-config read path Phase 7 builds; adding it here would mean
redoing it once that infrastructure exists. **View/copy/share counters are still not
incremented** by these endpoints — `PROMPT_VIEW`/`PROMPT_COPY`/`PROMPT_SHARE` are analytics
events (Section 13), and bumping the counters from inside the analytics-ingestion endpoint
in Phase 6 is the single place that should happen, rather than scattering `increment` calls
across every read endpoint. `favoriteCount` is the one exception — Section 11 explicitly
requires it to be maintained by the favorites endpoints themselves, so that happens now, not
in Phase 6. **The `trendingScore` used for `sort=trending` is static** — seeded once in
Phase 2, not recalculated. The time-decay recalculation job is explicitly Phase 6's job
(Section 14: "Add time decay so new content can become trending").

## What's Implemented in Phase 6 — Analytics: Events, Views, Copies, Favorites, Shares, Trending

- [x] **Event ingestion** (`src/modules/analytics/`) — `POST /api/v1/analytics/events`, gated
  by `X-Device-ID` (same anonymous-user layer as Favorites/History) and a stricter rate
  limit (`strictRateLimiter`) to deter fake event spam per Section 44. Accepts all eleven
  event types from Section 13 (`APP_OPEN`, `PROMPT_VIEW`, `PROMPT_COPY`, `PROMPT_FAVORITE`,
  `PROMPT_UNFAVORITE`, `PROMPT_SHARE`, `VIDEO_VIEW`, `IMAGE_VIEW`, `CATEGORY_VIEW`, `SEARCH`,
  `AI_TOOL_CLICK`) with a free-form `metadata` JSON payload.
- [x] **Counter side-effects, deliberately scoped** — `PROMPT_VIEW` increments
  `Prompt.viewCount`, `PROMPT_COPY` increments `copyCount`, `PROMPT_SHARE` increments
  `shareCount`. **`PROMPT_FAVORITE`/`PROMPT_UNFAVORITE` do *not* touch `favoriteCount`** —
  that counter is already maintained transactionally by the Favorites module (Phase 5), and
  incrementing it again here would double-count every favorite a client also logs as an
  event. This is tested explicitly (`tests/analytics.test.ts`).
- [x] **Trending recalculation job** (`src/jobs/recalculateTrending.job.ts`) — implements
  Section 14's formula (`views + favorites×3 + copies×2 + shares×5`) with exponential time
  decay (halves every 7 days), so fresh content with modest engagement can outrank stale
  content with a large lifetime total. Pure function (`computeTrendingScore`) is unit-tested
  directly — decay-at-one-half-life, zero-for-unpublished, and negative-age clamping are all
  covered.
- [x] **In-process scheduler** (`src/jobs/scheduler.ts`) — runs the recalculation job every
  `TRENDING_RECALC_INTERVAL_MINUTES` (default 15) via `setInterval`, no external cron
  dependency. This is intentionally lightweight for a single-instance Render deployment; the
  code comments flag that a multi-instance deployment should move this to a dedicated
  worker so it doesn't run redundantly on every instance.
- [x] **Manual admin trigger** — `POST /api/v1/admin/analytics/recalculate-trending`
  (`CONTENT_ADMIN`/`SUPER_ADMIN`) for immediate refresh without waiting for the schedule,
  audit-logged like every other admin action.

### A note on scope

Per the phased plan, **the admin analytics dashboard (totals, most-viewed/copied/favorited
leaderboards, per-category breakdowns) is Phase 9's job**, not this one. This phase writes
the `analytics_events` rows and maintains the counters that dashboard will aggregate — the
raw data is there and ready, but no aggregation/reporting endpoints exist yet.

## What's Implemented in Phase 7 — Remote Configuration: App Config, Feature Flags, Video Control, App Version

- [x] **Video visibility enforcement** (`src/modules/prompts/prompt-visibility.service.ts`) —
  the Section 16-18 chain (`global_video_enabled AND category_video_enabled AND
  prompt_video_enabled`) is now enforced everywhere, not just modeled: prompt browsing,
  search, trending/popular/latest, category detail, home sections, favorites, and history
  all route through one gate.
  - **VIDEO-only prompts** that fail the chain are excluded from results entirely via a
    Prisma `WHERE` clause (`buildVideoVisibilityWhere`) — they have nothing else to show, so
    a direct link to one 404s, consistent with it being absent from every listing.
  - **BOTH-type prompts** are never excluded — they still have image content — instead their
    video media is stripped from the response (`stripHiddenVideoMedia`) in a lossless
    post-processing pass that never changes how many prompts come back, so pagination
    `total` counts stay accurate.
  - The three-flag boolean logic itself (`isVideoVisible`) is a pure function, unit-tested
    against **all four cases from Section 53** with no database required.
- [x] **App settings / feature flags** (`src/modules/app-config/`) — admin CRUD over the
  `AppSetting` key/value store seeded in Phase 2 (`GET/POST /admin/app-config`,
  `PATCH /admin/app-config/:key`), plus the combined public endpoint,
  **`GET /api/v1/app/config`** (Section 59), returning feature flags, video/maintenance
  status, and general app settings from a single query.
- [x] **Maintenance mode** (Section 28) — the `maintenance_mode` flag surfaces in
  `GET /app/config` alongside a configurable `maintenance_message`.
- [x] **App version management** (`src/modules/app-version/`) — per-platform admin
  configuration (`GET/PUT /admin/app-version/:platform`) and the public check,
  **`GET /api/v1/app/version?platform=ANDROID&currentVersion=1.2.0`**, which computes
  `FORCE`/`OPTIONAL`/`NONE` by comparing the client's version against `minimumVersion` and
  `latestVersion` (a tiny dependency-free comparator in `src/utils/semver.ts` — no need for
  a full semver package for three dot-separated numbers). An admin's manual `forceUpdate`
  override and the version-based computation are OR'd together in the response.

### Endpoints added this phase

| Area | Public | Admin |
|---|---|---|
| App Config | `GET /app/config` | `GET/POST /admin/app-config`, `GET/PATCH /admin/app-config/:key` |
| App Version | `GET /app/version?platform=&currentVersion=` | `GET /admin/app-version`, `GET/PUT /admin/app-version/:platform` |

All paths relative to `/api/v1`.

### A note on scope

**Ad configuration is still not built** — `GET /app/config`'s `ads` object only reflects the
master `ads_enabled` kill switch pulled from `AppSetting`, not the granular per-ad-type
configuration (frequency, cooldown, session limits) from Sections 19-25. That's Phase 8's
`AdConfig` table, which already exists in the schema (seeded with disabled defaults back in
Phase 2) but has no admin CRUD or public read endpoint yet.

## What's Implemented in Phase 8 — Ad Management: AdConfig, Interstitial, Banner, Rewarded, Native, App Open

- [x] **Admin CRUD** (`src/modules/ads/`) — `GET/POST /admin/ads`, `GET/PATCH/DELETE
  /admin/ads/:id`, over the `AdConfig` table seeded (disabled) in Phase 2. Each row's
  identity is its `(adType, platform)` pair — enforced both at the DB level (the schema's
  `@@unique([adType, platform])`) and the service level (a clear `409 Conflict` instead of a
  raw constraint-violation error). `adType`/`platform` can't be changed via update, since
  doing so would just make the row a different config slot — create a new one instead.
- [x] **Remote kill switch** (Section 25) — `POST /admin/ads/disable-all` flips every ad
  config row to `enabled: false` in one call, audit-logged, for "we need ads off *right
  now*" situations.
- [x] **Public config** — `GET /api/v1/ads/config?platform=ANDROID` (Section 25's literal
  example path), returning the exact shape from Section 24: `banner`, `interstitial`,
  `rewarded`, `native`, `appOpen`, each with `enabled`, `adUnitId`, `frequencyType`/`Value`,
  `cooldownSeconds`, `maxPerSession`, and the four `showOn*` placement flags. Never exposes
  anything beyond the public ad unit ID — no network credentials exist in this table to leak
  in the first place.
- [x] **Per-platform overrides with fallback** — a platform-specific row (`ANDROID`/`IOS`)
  always wins over an `ALL`-platform row for the same ad type; an admin only needs to create
  a platform-specific row when that platform actually needs different values (a different ad
  unit ID, a tighter frequency cap, etc.) — everything else falls back to the shared default.
  Tested explicitly (`tests/ads.test.ts`) for both the override and the fallback case.
- [x] **Two independent kill-switch layers** — the master `ads_enabled` feature flag (from
  Phase 7's `AppSetting`) is AND'd with each row's own `enabled` flag in the public response,
  so *either* turning off the master switch *or* disabling one ad type independently takes
  effect — exactly the "Ad Remote Kill Switch" pattern from Section 25, built on
  infrastructure Phase 7 already established rather than a second, parallel flag system.
- [x] **Never hard-coded ad unit IDs anywhere** — the Phase 2 seed left every `adUnitId`
  empty; this phase's `create` defaults to `''` too. Real ad unit IDs only ever enter the
  system through an admin API call.

### Endpoints added this phase

| Public | Admin |
|---|---|
| `GET /ads/config?platform=ANDROID\|IOS` | `GET/POST /admin/ads`, `GET/PATCH/DELETE /admin/ads/:id`, `POST /admin/ads/disable-all` |

All paths relative to `/api/v1`.

## What's Implemented in Phase 9 — Admin Analytics: Dashboard, Reports, Charts, Content Analytics

- [x] **Dashboard overview** (`src/modules/admin-dashboard/`) — `GET /admin/dashboard`
  aggregates everything Section 33 asks for in as few queries as possible (`Promise.all`
  over counts/groupBy/aggregate, not N+1 reads): total/active users (today, 7d, 30d), total
  prompts/categories, total views/copies/shares/favorites, per-content-type totals, a
  per-event-type breakdown, and the pending-report count.
- [x] **Leaderboards** — `GET /admin/dashboard/top-prompts?metric=viewCount|copyCount|favoriteCount`
  and `GET /admin/dashboard/top-categories`, both index-backed `ORDER BY ... LIMIT` /
  `groupBy` queries, not an in-memory sort of the whole table.
- [x] **Chart data** — `GET /admin/dashboard/events-timeseries?eventType=&range=` returns
  daily `{date, count}` buckets for the admin frontend to render. Bucketed in JS rather than
  a raw SQL `date_trunc`, deliberately — this is an admin-only, moderate-volume read, so
  staying portable (no raw-query dependency, works identically on any Postgres version) beat
  the marginal performance win.
- [x] **Content safety reports** (`src/modules/reports/`, Section 35) — `POST /reports`
  (device-gated, anyone can flag a prompt as `INAPPROPRIATE`/`BROKEN_CONTENT`/
  `WRONG_CATEGORY`/`COPYRIGHT`/`OTHER`) and the admin review workflow:
  `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id/status`
  (`PENDING → REVIEWED/RESOLVED/DISMISSED`), each transition audit-logged.
- [x] **Audit log viewer** (`src/modules/audit-logs/`) — read-only `GET /admin/audit-logs`
  over every `AuditLog` row written since Phase 3 (admin logins, every content
  create/edit/publish/delete, ad config changes, remote config changes — it's all been
  accumulating this whole time), filterable by action/entityType/adminId.
- [x] **Admin user management** (`src/modules/admin-users/`) — `GET /admin/admin-users`,
  `GET/PATCH/DELETE /admin/admin-users/:id`, extending the existing `AdminRepository` from
  Phase 3 rather than duplicating it. **SUPER_ADMIN-only**, with explicit self-protection
  guards tested directly: an admin can't deactivate their own account, can't change their
  own role, and can't delete themselves — all three are `400`s, not silently-allowed
  footguns that could lock the last SUPER_ADMIN out.

### Endpoints added this phase

| Area | Public | Admin |
|---|---|---|
| Dashboard | — | `GET /admin/dashboard`, `/top-prompts`, `/top-categories`, `/events-timeseries` |
| Reports | `POST /reports` | `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id/status` |
| Audit Logs | — | `GET /admin/audit-logs` |
| Admin Users | — | `GET /admin/admin-users`, `GET/PATCH/DELETE /admin/admin-users/:id` |

All paths relative to `/api/v1`. Dashboard/reports/audit-logs are readable by `ANALYTICS`,
`CONTENT_ADMIN`, and `SUPER_ADMIN`; report status changes and all admin-user management are
more restricted (`CONTENT_MANAGE_ROLES` and `SUPER_ADMIN`-only, respectively) since they're
write actions with real consequences.

## What's Implemented in Phase 10 — Testing, Security, Docker, Swagger, Production Configuration

This phase is deliberately not about new features — it's a hardening and completeness pass
over everything Phases 1-9 built.

- [x] **A real security fix, not just a checklist item**: Helmet's default Content-Security-Policy
  was silently breaking the Swagger UI's inline scripts since Phase 1 (this is a JSON API — the
  only HTML it ever serves is the dev-only docs page, which a strict default CSP isn't tuned
  for). Fixed by turning CSP off with an inline comment explaining why, while every other
  Helmet protection (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, hidden
  `X-Powered-By`) stays on.
- [x] **Production boot-time safety net** — the server now refuses to start with
  `NODE_ENV=production` if `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are still the
  out-of-the-box dev defaults, instead of silently running with forgeable admin tokens.
- [x] **CI workflow** (`.github/workflows/ci.yml`) — typecheck, lint, and the full test suite
  against a real Postgres service container on every push/PR. `npm run ci` runs the same
  three steps locally.
- [x] **`render.yaml` gap closed** — `TRENDING_RECALC_INTERVAL_MINUTES` (added in Phase 6)
  was missing from the deployment blueprint's env var list; a fresh Render deploy would have
  silently fallen back to the default instead of failing loudly. Fixed.
- [x] **Complete API reference** (below) — every endpoint across all 10 phases, in one table.
- [x] **Production deployment checklist** (below).

### Production Deployment Checklist

Before pointing this at real users:

- [ ] Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to real random values (the server
      refuses to boot in production with the dev defaults, but double-check anyway):
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] Set `CORS_ORIGIN` to your actual Flutter web / admin dashboard origin(s),
      comma-separated — not `*`.
- [ ] Set real `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
- [ ] Change `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD` before running the seed script
      against production — then change the seeded admin's password via
      `POST /admin/auth/change-password` and never rely on the seed credentials again.
- [ ] Review `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` against your actual expected traffic —
      the defaults (100 req/min/IP global, ~20 req/min/IP on login/refresh/analytics) are a
      reasonable starting point, not a load-tested number.
- [ ] Set real ad unit IDs via `POST/PATCH /admin/ads` — they're empty by design until an
      admin sets them (Section 58: never hard-code production ad IDs).
- [ ] Turn on the feature flags you actually want live via `PATCH /admin/app-config/:key`
      (`ads_enabled`, `notifications_enabled`, etc. default to `false`).
- [ ] Confirm `TRENDING_RECALC_INTERVAL_MINUTES` is reasonable for your content volume — the
      scheduler is in-process (see Phase 6's notes); a multi-instance deployment should move
      it to a dedicated worker instead.
- [ ] Run `npm run prisma:migrate:deploy` (not `migrate dev`) against the production database.
- [ ] Confirm `LOG_LEVEL=info` or stricter in production — `debug`/`trace` will log request
      bodies and should stay dev-only.
- [ ] Point Render's (or your platform's) health check at `/api/v1/health` — it verifies
      database connectivity, not just process liveness.

### Complete API Reference

All paths relative to `/api/v1`. **Auth** column: `—` = no authentication, `Device` =
requires `X-Device-ID` header, `Admin` = requires `Authorization: Bearer <token>` with the
role(s) shown.

<details>
<summary><strong>Admin Auth</strong> — <code>/admin/auth</code></summary>

| Method | Path | Auth |
|---|---|---|
| POST | `/admin/auth/login` | — |
| POST | `/admin/auth/refresh` | — |
| POST | `/admin/auth/logout` | Admin |
| GET | `/admin/auth/me` | Admin |
| POST | `/admin/auth/register-admin` | Admin (SUPER_ADMIN) |
| POST | `/admin/auth/change-password` | Admin |

</details>

<details>
<summary><strong>Categories</strong> — <code>/categories</code>, <code>/admin/categories</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/categories` | — |
| GET | `/categories/:id` | — |
| GET | `/categories/:id/prompts` | — |
| GET | `/admin/categories` | Admin (write) |
| GET | `/admin/categories/:id` | Admin (write) |
| POST | `/admin/categories` | Admin (write) |
| PATCH | `/admin/categories/:id` | Admin (write) |
| PATCH | `/admin/categories/:id/status` | Admin (manage) |
| DELETE | `/admin/categories/:id` | Admin (manage) |

</details>

<details>
<summary><strong>AI Tools</strong> — <code>/ai-tools</code>, <code>/admin/ai-tools</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/ai-tools` | — |
| GET | `/ai-tools/:id` | — |
| GET | `/admin/ai-tools` | Admin (write) |
| GET | `/admin/ai-tools/:id` | Admin (write) |
| POST | `/admin/ai-tools` | Admin (write) |
| PATCH | `/admin/ai-tools/:id` | Admin (write) |
| PATCH | `/admin/ai-tools/:id/status` | Admin (manage) |
| DELETE | `/admin/ai-tools/:id` | Admin (manage) |

</details>

<details>
<summary><strong>Tags</strong> — <code>/tags</code>, <code>/admin/tags</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/tags` | — |
| GET | `/admin/tags` | Admin (write) |
| GET | `/admin/tags/:id` | Admin (write) |
| POST | `/admin/tags` | Admin (write) |
| PATCH | `/admin/tags/:id` | Admin (write) |
| DELETE | `/admin/tags/:id` | Admin (manage) |

</details>

<details>
<summary><strong>Prompts</strong> — <code>/prompts</code>, <code>/search</code>, <code>/admin/prompts</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/prompts` | — |
| GET | `/prompts/trending` | — |
| GET | `/prompts/popular` | — |
| GET | `/prompts/latest` | — |
| GET | `/prompts/popular-videos` | — |
| GET | `/prompts/popular-images` | — |
| GET | `/prompts/featured` | — |
| GET | `/prompts/search?q=` | — |
| GET | `/prompts/:id` | — |
| GET | `/search?q=` (alias of `/prompts/search`) | — |
| GET | `/admin/prompts` | Admin (write) |
| GET | `/admin/prompts/:id` | Admin (write) |
| POST | `/admin/prompts` | Admin (write) |
| PATCH | `/admin/prompts/:id` | Admin (write) |
| POST | `/admin/prompts/:id/duplicate` | Admin (write) |
| POST | `/admin/prompts/:id/publish` | Admin (manage) |
| POST | `/admin/prompts/:id/unpublish` | Admin (manage) |
| POST | `/admin/prompts/:id/archive` | Admin (manage) |
| DELETE | `/admin/prompts/:id` | Admin (manage) |
| PATCH | `/admin/prompts/:id/flags` | Admin (manage) |
| POST | `/admin/prompts/:id/tags` | Admin (write) |
| DELETE | `/admin/prompts/:id/tags/:tagId` | Admin (write) |

</details>

<details>
<summary><strong>Media</strong> — <code>/admin/prompts/:promptId/media</code>, <code>/admin/media</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/admin/prompts/:promptId/media` | Admin (write) |
| POST | `/admin/prompts/:promptId/media` | Admin (write) |
| PATCH | `/admin/prompts/:promptId/media/reorder` | Admin (write) |
| PUT | `/admin/media/:mediaId` | Admin (write) |
| DELETE | `/admin/media/:mediaId` | Admin (write) |

</details>

<details>
<summary><strong>Home</strong> — <code>/home</code>, <code>/admin/home-sections</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/home` | — |
| GET | `/admin/home-sections` | Admin (write) |
| GET | `/admin/home-sections/:id` | Admin (write) |
| POST | `/admin/home-sections` | Admin (manage) |
| PATCH | `/admin/home-sections/:id` | Admin (manage) |
| PATCH | `/admin/home-sections/:id/status` | Admin (manage) |
| DELETE | `/admin/home-sections/:id` | Admin (manage) |

</details>

<details>
<summary><strong>Favorites & History</strong> — <code>/favorites</code>, <code>/history</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/favorites` | Device |
| POST | `/favorites` | Device |
| DELETE | `/favorites/:promptId` | Device |
| GET | `/history` | Device |
| POST | `/history` | Device |
| DELETE | `/history` (all, or `?promptId=` for one) | Device |

</details>

<details>
<summary><strong>Analytics</strong> — <code>/analytics</code>, <code>/admin/analytics</code></summary>

| Method | Path | Auth |
|---|---|---|
| POST | `/analytics/events` | Device |
| POST | `/admin/analytics/recalculate-trending` | Admin (manage) |

</details>

<details>
<summary><strong>Remote Config</strong> — <code>/app/config</code>, <code>/app/version</code>, admin equivalents</summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/app/config` | — |
| GET | `/app/version?platform=&currentVersion=` | — |
| GET | `/admin/app-config` | Admin (manage) |
| GET | `/admin/app-config/:key` | Admin (manage) |
| POST | `/admin/app-config` | Admin (manage) |
| PATCH | `/admin/app-config/:key` | Admin (manage) |
| GET | `/admin/app-version` | Admin (manage) |
| GET | `/admin/app-version/:platform` | Admin (manage) |
| PUT | `/admin/app-version/:platform` | Admin (manage) |

</details>

<details>
<summary><strong>Ads</strong> — <code>/ads/config</code>, <code>/admin/ads</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/ads/config?platform=ANDROID\|IOS` | — |
| GET | `/admin/ads` | Admin (manage) |
| GET | `/admin/ads/:id` | Admin (manage) |
| POST | `/admin/ads` | Admin (manage) |
| PATCH | `/admin/ads/:id` | Admin (manage) |
| DELETE | `/admin/ads/:id` | Admin (manage) |
| POST | `/admin/ads/disable-all` | Admin (manage) |

</details>

<details>
<summary><strong>Admin Analytics & Moderation</strong> — dashboard, reports, audit logs, admin users</summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/admin/dashboard` | Admin (dashboard) |
| GET | `/admin/dashboard/top-prompts?metric=&limit=` | Admin (dashboard) |
| GET | `/admin/dashboard/top-categories?limit=` | Admin (dashboard) |
| GET | `/admin/dashboard/events-timeseries?eventType=&range=` | Admin (dashboard) |
| POST | `/reports` | Device |
| GET | `/admin/reports` | Admin (dashboard) |
| GET | `/admin/reports/:id` | Admin (dashboard) |
| PATCH | `/admin/reports/:id/status` | Admin (manage) |
| GET | `/admin/audit-logs` | Admin (dashboard) |
| GET | `/admin/admin-users` | Admin (SUPER_ADMIN only) |
| GET | `/admin/admin-users/:id` | Admin (SUPER_ADMIN only) |
| PATCH | `/admin/admin-users/:id` | Admin (SUPER_ADMIN only) |
| DELETE | `/admin/admin-users/:id` | Admin (SUPER_ADMIN only) |

</details>

**Role key**: *write* = `SUPER_ADMIN`/`CONTENT_ADMIN`/`EDITOR` · *manage* =
`SUPER_ADMIN`/`CONTENT_ADMIN` · *dashboard* = `SUPER_ADMIN`/`CONTENT_ADMIN`/`ANALYTICS` ·
`SUPER_ADMIN` always passes every check regardless of the list.

## Project Status

All 10 phases from the original development plan are complete. This is a full backend:
anonymous device identity, full content CMS (categories/prompts/media/AI tools/tags),
Cloudinary integration, public browsing/search/trending/home feed, favorites/history,
analytics event ingestion with trending recalculation, enforced video-visibility rules,
remote config/feature flags/app version management, a complete ad configuration system, and
an admin analytics/moderation dashboard — all behind JWT auth with role-based access
control, all audit-logged, all tested.

What's *not* here, by design, and would be natural next steps rather than gaps in the
original plan: push notification delivery (the `NotificationToken` model exists and tokens
can be registered, but no FCM sending logic — Section 50 explicitly scoped this as
"prepare for future," not build now), and a dedicated multi-instance job queue for the
trending scheduler (documented in Phase 6/10 as a single-instance-appropriate tradeoff).

---

## License

Proprietary — All rights reserved.

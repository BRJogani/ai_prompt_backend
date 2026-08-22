# Continuation Prompt — AI Prompt Inspiration App Backend

Paste this whole file as your first message to Antigravity (or Claude Code, or any
agentic coding tool) when you open this project, so it has full context before making
any changes.

---

## What this project is

A production-ready Node.js/TypeScript/Express/PostgreSQL/Prisma backend for a mobile app
("AI Prompt Inspiration") where anonymous users browse AI-generated image/video prompts,
save favorites, view history, and open external AI tools. It has a full admin CMS with
JWT-authenticated, role-based access control.

**Status: all 10 planned phases are complete and merged into this codebase.** This is not
a partial build — read `README.md` top to bottom before assuming anything is missing;
it has a complete API reference table and a "Project Status" section listing the two
things that are deliberately out of scope (push notification *delivery*, and a
multi-instance job queue for trending recalculation).

## Architecture — read this before writing any code

- **Layering, strictly enforced**: `*.repository.ts` (Prisma calls only) → `*.service.ts`
  (business logic, calls repositories) → `*.controller.ts` (thin, calls services, wraps
  in `catchAsync`) → `*.routes.ts` (wires `authenticate`/`authorize`/`validate`
  middleware to controller methods). Every module in `src/modules/*` follows this
  exact pattern. Match it for any new module.
- **Path aliases**: `@config/*`, `@controllers/*`, `@routes/*`, `@services/*`,
  `@repositories/*`, `@middleware/*`, `@validators/*`, `@utils/*`, `@constants/*`,
  `@types/*`, `@jobs/*`, `@modules/*` — all defined in `tsconfig.json`'s `paths` AND
  mirrored in `jest.config.js`'s `moduleNameMapper`. **If you add a new alias prefix,
  update both files or tests will fail to resolve imports.**
- **Response envelope**: every endpoint returns `{ success, message, data }` (or
  `{ success: false, message, errors: [] }` on failure) via `sendSuccess()` in
  `src/utils/ApiResponse.ts`. Never hand-roll `res.json(...)` in a controller.
- **Errors**: throw a subclass of `ApiError` (`src/utils/ApiError.ts` —
  `ValidationError`, `NotFoundError`, `ConflictError`, `AuthenticationError`,
  `AuthorizationError`, etc.) from anywhere in a service. The centralized
  `errorHandler` middleware normalizes it, Zod errors, and Prisma errors into the
  standard envelope. Never try/catch in a controller — `catchAsync()` forwards
  rejected promises automatically.
- **Validation**: every route body/query/params gets a Zod schema in
  `src/validators/*.validator.ts`, applied via the `validate(schema, 'body'|'query'|'params')`
  middleware. Query schemas commonly extend `paginationQuerySchema` from
  `common.validator.ts`.
- **Auth**: `authenticate` middleware (JWT, re-checks DB on every request — see its
  comment for why) populates `req.admin`. `authorize(...roles)` gates by role;
  `SUPER_ADMIN` always passes. Role groupings live in `src/constants/roles.ts`
  (`CONTENT_WRITE_ROLES`, `CONTENT_MANAGE_ROLES`, `ANALYTICS_READ_ROLES`,
  `DASHBOARD_READ_ROLES`) — reuse them, don't inline role arrays.
- **Anonymous users**: `resolveDeviceUser` middleware reads `X-Device-ID`, populates
  `req.deviceUser`. Required on Favorites/History/Analytics/Reports routes.
- **Audit logging**: any admin write action should call `recordAuditLog()` from
  `src/services/audit.service.ts` with an action name from
  `src/constants/adminActions.ts` (`AUDIT_ACTIONS`). It's best-effort (swallows its own
  errors) — never let it block the real action.
- **Video visibility**: if you touch any public prompt-reading code path, route it
  through `findPublicPromptsWithVideoGate` / `findPublicPromptByIdWithVideoGate` in
  `src/modules/prompts/prompt-visibility.service.ts` — don't call
  `promptRepository.findPublic` directly from a new consumer, or you'll bypass the
  Section 16-18 visibility rule silently. Read that file's comments; it explains the
  WHERE-clause-exclusion vs. media-stripping distinction (VIDEO-only prompts are
  excluded entirely, BOTH-type prompts just have video media stripped).
- **Route ordering**: in any router with both static and `:param` routes at the same
  level, static routes MUST be registered first (see `prompt-public.routes.ts` and
  `ad-config.routes.ts` for the pattern) — Express matches `/:id` against literal
  segments too.

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum; Cloudinary vars for media upload
docker compose up -d postgres
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev
```

Health check: `http://localhost:4000/api/v1/health`. Swagger (dev only):
`http://localhost:4000/api/docs`. Full endpoint list: `README.md`'s "Complete API
Reference" section.

Before committing anything: `npm run ci` (typecheck + lint + test). There's a GitHub
Actions workflow (`.github/workflows/ci.yml`) that runs the same thing against a real
Postgres container on every push.

## Database

`prisma/schema.prisma` has every model. **Do not run `prisma migrate dev` casually** —
check `prisma/migrations/` first; if it's empty, this is the first migration and you're
fine. If schema changes are needed, edit `schema.prisma`, then
`npm run prisma:migrate:dev -- --name <description>`.

`prisma/seed.ts` is idempotent (upsert-based) — safe to re-run.

## Conventions worth internalizing from how this was built

- **Slug generation**: `slugify()` from `src/utils/slug.ts` + an `ensureUniqueSlug()`
  loop pattern (see `category.service.ts`, `prompt.service.ts`) — copy this pattern for
  any new slugged entity.
- **Soft delete**: prompts use `status: ARCHIVED` + `deletedAt` timestamp, never a hard
  DB delete, so analytics history survives. Follow this for any other "deletable"
  content entity you add.
- **Cross-cutting reads get a shared service function**, not copy-pasted logic. Example:
  `findPublicPromptsWithVideoGate` is called by the prompt-browsing service, the
  category service, and the home-section service — one implementation, three
  consumers. If you're about to write similar filtering logic in two places, stop and
  extract it first.
- **Ad network / admin action names are plain strings, not enums**, specifically so new
  values don't require a migration (see `AdConfig.adNetwork` and `AuditLog.action` in
  the schema, and the comment on `AUDIT_ACTIONS`). Follow this pattern for any similarly
  open-ended taxonomy.
- **Counter maintenance discipline**: `favoriteCount` is updated transactionally by the
  Favorites module itself (Section 11's explicit requirement); `viewCount`/`copyCount`/
  `shareCount` are updated by the Analytics event-ingestion endpoint, not by the read
  endpoints that display them. If you add a new counter, decide up front which single
  code path owns incrementing it — see the comment in `analytics.service.ts` explaining
  why `PROMPT_FAVORITE` events deliberately don't touch `favoriteCount`.

## What's genuinely not built (real next steps, not oversights)

1. **Push notification delivery.** `NotificationToken` model + registration exists;
   there's no Firebase Admin SDK integration or actual send logic. If asked to build
   this: add `firebase-admin` as a dependency, a `src/services/fcm.service.ts`, and
   likely a new `AnalyticsEventType`-triggered or admin-triggered send path.
2. **Multi-instance-safe trending scheduler.** Currently `setInterval`-based in-process
   (`src/jobs/scheduler.ts`) — correct for a single Render instance, wrong for
   horizontal scaling. If this app ever runs >1 instance, extract the job to a separate
   worker process/service.
3. **Deep link routing** is prepared (every Prompt has a `slug`) but there's no
   dedicated slug-based lookup endpoint — `GET /prompts/:id` is UUID-only. Trivial to
   add if needed (`findFirst({ where: { OR: [{id}, {slug}] } })`).

## If you're asked to add a new feature

1. Check `README.md`'s API reference first — it might already exist.
2. Follow the repository → service → controller → routes layering exactly.
3. Add Zod validators in `src/validators/`.
4. Reuse existing role constants, `catchAsync`, `sendSuccess`, `ApiError` subclasses.
5. Add audit logging for admin writes.
6. Mount new routers in `src/routes/v1/index.ts` (keep it a pure aggregator — no logic
   there).
7. Add tests following the existing mock pattern (`jest.mock('@config/database', ...)`
   with an in-memory `Map`-based fake — see any `tests/*.test.ts` file for the pattern).
8. Update `README.md`'s API reference table and Swagger tags in `src/config/swagger.ts`.

Ask me before running `prisma migrate dev` against a database with real data in it, and
before changing anything under `prisma/migrations/` that's already been applied
somewhere.

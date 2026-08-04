# Atlas Oracle — Universal Foresight Engine

> A universal foresight engine for anyone facing any decision. Not a market tool. Not a niche app. An oracle for every human question.

Last updated: 2026-08-05

## Quick Start

```bash
cd frontend
npm run db:push              # push schema to create/update SQLite DB
npm run db:seed              # seed admin user (admin@atlas-oracle.com / admin123)
npm run dev                  # start dev server on http://localhost:3000
```

Requires `DATABASE_URL="file:./data/dev.db"` in `.env.local` for database commands.

## Current Status: PRE-DEPLOYMENT HARDENING COMPLETE

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | 0 errors |
| ESLint (`npm run lint`) | 0 errors, 0 warnings |
| Vitest (`npx vitest run`) | 323 passed, 0 failed, 42 files |
| Next.js build (`npm run build`) | Compiled successfully, 40 pages, 21 API routes |
| Playwright E2E (`npx playwright test --workers=1`) | 56 passed, 2 skipped (Google/GitHub OAuth unconfigured), 0 failed |
| Prisma → Drizzle Migration | Complete — all routes, tests, and configs updated |
| Git hygiene | `frontend/data/dev.db` untracked from git (contained user data + bcrypt hashes) |

> **Note**: `frontend/data/dev.db` removal from tracking and the `.env.local` gitignore were committed in `5b455ed`; `frontend/data/.gitkeep` (commit `e1fa181`) keeps the DB dir present in fresh clones/CI so the build-time `@libsql` open (`/api/admin/analytics` page-data collection) succeeds.

### CI Pipeline History (recent)

| Run | Commit | check | build | e2e | electron-build | docker |
|---|---|---|---|---|---|---|
| #65 | 71b1c3d | ✅ | ✅ | ✅ | ✅ | ❌ (busybox has no `--group`/`--ingroup`) |
| #66 | 4a53178 | ✅ | ✅ | ✅ | ✅ | ✅ |

**Final validation**: run #66 (4a53178) fully green — workflow badge reads `CI · passing` for `ci.yml@main`. Docker fix: reverted to `addgroup --system --gid 1001 nodejs` + `adduser --system --uid 1001 nextjs` + `chown -R nextjs:nodejs /app` (busybox-compatible). Pre-#65 failures (e2e `uptime` vs `version`, electron/docker path issues) were all resolved in the earlier run series.

## Git History

```
4a53178 fix(docker): use busybox-compatible addgroup/adduser flags (no --group/--ingroup)
71b1c3d ci(docker): isolate base-image pull, merge diagnostics into one annotation
028b86f ci(docker): use --progress=plain and add docker diagnostics to surface real build errors
6e76efa ci(docker): surface build output as error annotations on failure
e1fa181 fix(ci): keep frontend/data/ dir in git so builds work on fresh checkouts
b586d75 chore: rename prisma/ to data/ for DB storage, fix Docker data-dir permissions
5b455ed feat: production hardening - email verification, subscription gates, DB-backed rate limiting
68f0ea5 fix: e2e test expects 'version' not 'uptime'
bb7f19a fix: Dockerfile CMD + electron main.js frontend/ path
d8e3fe6 fix: YAML folded block scalar for docker build
a5d84ea fix: Docker build ARGs, remove invalid msix property
aa47361 fix: electron-build deps, docker build context
c7fa5de fix: add preact dependency
a8caeee fix: migrate middleware to proxy (Next.js 16)
76a7653 fix: build types, lint, Docker/CI for Drizzle
5447918 merge: remove prisma.config.ts
446d35b feat: Prisma → Drizzle ORM + Phase 11 + all tests
...7f4202d atlas working version
```

## What Was Done (11 Phases Complete)

### Phase 1: Security & Bug Fixes
- Middleware dual-export fix, API route protection, signup race condition (P2002), pagination NaN/DoS fix, CSP+HSTS, admin guard, password reset token hashing, .dockerignore, analytics groupBy fix, try/catch on unprotected routes

### Phase 2: Auth Hardening
- Email normalization, rate limiting, Retry-After headers, password policy max lengths

### Phase 3: Observability
- Sentry integration (3 config files), structured logger, health check with DB probe

### Phase 4: UI/UX & Accessibility
- Responsive sidebar/navbar with hamburger toggles, ThemeProvider/ThemeToggle, skip-to-content, prefers-reduced-motion, aria-live, SVG icons, CardTitle as `<h3>`

### Phase 5: Code Quality
- `<Link>` replacing `<a>`, null safety, AbortController in useFetch, user-table router.refresh(), O(n^2) fix

### Phase 6: CI/CD
- GitHub Actions CI, Sentry email service, Resend integration

### Phase 7: Docker & Config
- Dockerfile HEALTHCHECK, .gitignore, seed guard, .env.example, admin settings

### Phase 8: Test & Lint Cleanup
- Fixed all 23 test failures (health route, signup, predictions, analytics, user-table, sidebar)
- Fixed React 19 lint errors (set-state-in-effect, hydration toggle)
- Fixed middleware whitelisting /api/auth/* routes

### Phase 9: Production Readiness
- OAuth Providers: Google and GitHub OAuth via NextAuth v5
- OAuth UI: Google/GitHub buttons on login and signup forms
- Sentry Hardening: Replay integration, cookie/header scrubbing
- Middleware Rate Limiting: 20 req/min per IP for auth POSTs
- Docker Compose: volume persistence, health checks, env passthrough
- Vercel Config: security headers, cache control, auth rewrites
- CI/CD Enhancement: Playwright E2E, Docker build+healthcheck jobs
- E2E Tests: comprehensive Playwright tests

### Phase 10: Universal Foresight Identity
- Reframed as universal foresight engine
- Landing page, README, architecture docs updated
- Simulation engine: 12 personas, 60 predictions, 78% accuracy

### Phase 11: Prisma → Drizzle Migration + Subscription Features
- **ORM Migration**: Replaced Prisma with Drizzle ORM across all API routes (15 source files rewritten)
- **Schema**: 7 tables (users, accounts, sessions, predictions, subscriptions, predictionFeedbacks, analyticsEvents) with Drizzle relations
- **Auth Adapter**: Migrated to @auth/drizzle-adapter for NextAuth v5
- **All Drizzle Queries**: Async `.get()`, `.all()`, `.run()` calls properly awaited
- **Test Infrastructure**: All 37 test files (293 tests) rewritten with Drizzle chainable API mocks
- **Prediction Feedback**: Users can rate predictions for accuracy tracking
- **Subscription Tiers**: FREE (5/mo) and PRO (unlimited) with usage tracking
- **Analytics Dashboard**: User and admin analytics with domain breakdown, accuracy rates
- **Rate Limiting**: Enhanced per-route rate limiting with headers

### Phase 12: Production Hardening (Pre-Deployment)
- **DB-backed rate limiter** (`lib/rate-limit.ts`): replaced in-memory maps with a `RateLimit` table via `@libsql/client` — atomic upsert, survives restarts. All call sites awaited.
- **Email verification gate** (`EMAIL_VERIFICATION_REQUIRED`, default off): signup stores a 24h sha256-hashed token, `/api/auth/verify-email` (10/min) verifies, `/api/auth/resend-verification` (3/min) resends with enum-safe messages. Unverified users can still log in but `/api/predictions` POST returns 403. Verification banner in settings, auto-verify page, signup form messaging. OAuth users auto-verified.
- **Account deletion** (`/api/user/delete`): full GDPR-style removal of user + predictions + feedback + subscriptions.
- **Admin approval gate** (`ADMIN_APPROVAL_REQUIRED`, default false): PRO upgrades become `PENDING`; admin approves/rejects via `/api/admin/subscriptions` PATCH + subscription table UI. Free tier keeps 5 predictions/month.
- **Payment gate** (`PAYMENT_GATE_ENABLED` + `STRIPE_SECRET_KEY`, default off): 402 upgrade path; otherwise PRO upgrades freely.
- **Privacy page** (`/privacy`) + cookie consent banner (pointer-events fix so it never blocks clicks).
- **Session maxAge** 30 days; **proxy.ts** (Next 16) public routes now include `/verify-email`, `/privacy`, `/signup`.
- **Settings overhaul**: profile form, password change form, delete account, subscription management.
- **Prediction share button**, `app/api/sr` endpoint (`lib/sr.ts`), theme toggle component.
- **Migration script** `scripts/migrate.ts` — backfills `emailVerifyToken`/`emailVerifyExpires` (applied to dev.db).
- **Tests**: +3 gate test files + middleware/public-route tests + predictions-gate tests → 323 tests / 42 files; e2e 56 passed / 2 skipped.
- **Git hygiene**: `frontend/data/dev.db` (real user data) removed from tracking; `.env.local` gitignored (never committed).

## Key Architecture Decisions

- **Drizzle ORM over Prisma**: Lighter weight, better TypeScript inference, no code generation step, native LibSQL support
- **Conditional Sentry**: `next.config.ts` wraps `withSentryConfig` only when `SENTRY_AUTH_TOKEN` is set
- **React 19 lint**: `useFetch` uses `eslint-disable-line` for synchronous setState in effect
- **ThemeToggle**: Uses `useSyncExternalStore` for hydration-safe mounting pattern
- **Middleware/Proxy**: `proxy.ts` (Next 16 replacement for middleware) whitelists `/api/auth/*` from auth checks, adds rate limiting for POST requests, and treats `/`, `/login`, `/signup`, `/verify-email`, `/privacy` as public
- **OAuth**: Conditional provider registration, auto-creates USER role on first login, auto-verified emails
- **Rate Limiting**: Three layers — proxy-level per-IP + DB-backed per-route (signup: 3/min, login: 5/min, etc.) + login lockout window
- **Feature gates**: `ADMIN_APPROVAL_REQUIRED`, `PAYMENT_GATE_ENABLED`, `EMAIL_VERIFICATION_REQUIRED` are all opt-in (default off) and read from env at module load — tests that vary them use `vi.resetModules()` + dynamic `import()`

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite for dev, Turso for production |
| `AUTH_SECRET` | Yes | JWT encryption key |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL (client-side accessible) |
| `OPENAI_API_KEY` | No | GPT-4o; without it uses mock predictions |
| `RESEND_API_KEY` | No | Email service for password reset/welcome emails |
| `RESEND_FROM_EMAIL` | No | Sender address for emails |
| `SENTRY_DSN` | No | Error tracking |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | No | Enables Sentry webpack plugin in next.config.ts |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| `EMAIL_VERIFICATION_REQUIRED` | No | `true` gates new accounts behind email verification (default off) |
| `ADMIN_APPROVAL_REQUIRED` | No | `true` makes PRO upgrades PENDING until admin approves (default off) |
| `PAYMENT_GATE_ENABLED` | No | `true` requires `STRIPE_SECRET_KEY` and returns 402 for unpaid upgrades (default off) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for payment gate |
| `LOGIN_RATE_LIMIT_MAX` | No | Login per-IP limit window (DB-backed; default 5) |
| `SIGNUP_RATE_LIMIT_MAX` | No | Signup per-IP limit window (DB-backed; default 3) |
| `RESET_RATE_LIMIT_MAX` | No | Password-reset per-IP limit window (DB-backed; default 3) |
| `PREDICT_RATE_LIMIT_MAX` | No | Predictions per-user limit window (DB-backed; default 10) |

> `.env.local` (frontend) holds dev-only overrides and is gitignored — it must never be committed. Production defaults live in `frontend/.env.example`.

## Deployment Options

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel dashboard (set root to `frontend/`)
3. Set environment variables (DATABASE_URL with Turso, AUTH_SECRET, NEXT_PUBLIC_APP_URL)
4. Deploy
5. Post-deploy: `npm run db:push` + `npm run db:seed`

### Docker
```bash
docker compose up -d
# Includes volume persistence, health checks, env var passthrough
```

### Local Build
```bash
cd frontend
npm run build
npm start
```

## What's Left

### Immediate (before shipping)
1. ✅ **Feature gates decided** — `ADMIN_APPROVAL_REQUIRED` off, `EMAIL_VERIFICATION_REQUIRED` off, `PAYMENT_GATE_ENABLED` **on** (production default in `frontend/.env.example`). ⚠️ The payment gate is a guard only — with a valid `STRIPE_SECRET_KEY` it silently bypasses to free activation; without one, PRO upgrades return 402. A real Stripe checkout integration is **not yet implemented** — do not ship with `PAYMENT_GATE_ENABLED=true` and no `STRIPE_SECRET_KEY` unless intentional.
2. ✅ **CI docker diagnostics trimmed** — removed the `docker pull node:22-alpine` step, `--progress=plain`, and "Surface build errors" annotation from `.github/workflows/ci.yml`.
3. ✅ **Local re-verification (2026-08-05)** — typecheck 0 errors, lint 0 warnings, vitest 323/323 passed, `next build` compiled (40 pages / 21 API routes), Playwright E2E 56 passed / 2 skipped.

### Production Environment Setup
1. Set up Turso database for production
2. Generate AUTH_SECRET: `openssl rand -base64 32`
3. Configure OpenAI API key (optional — app works with mock predictions)
4. Set up Resend account and verify custom domain
5. Set up Sentry project and configure alerting

### OAuth Setup
1. Create Google OAuth credentials at https://console.cloud.google.com/apis/credentials
2. Create GitHub OAuth app at https://github.com/settings/developers
3. Set callback URLs to `{NEXT_PUBLIC_APP_URL}/api/auth/callback/{provider}`
4. Add client ID and secret to environment variables

## Full Commit Log

```
4a53178 fix(docker): use busybox-compatible addgroup/adduser flags (no --group/--ingroup)
71b1c3d ci(docker): isolate base-image pull, merge diagnostics into one annotation
028b86f ci(docker): use --progress=plain and add docker diagnostics to surface real build errors
6e76efa ci(docker): surface build output as error annotations on failure
e1fa181 fix(ci): keep frontend/data/ dir in git so builds work on fresh checkouts
b586d75 chore: rename prisma/ to data/ for DB storage, fix Docker data-dir permissions
5b455ed feat: production hardening - email verification, subscription gates, DB-backed rate limiting
68f0ea5 fix: e2e test expects 'version' not 'uptime' (matches health endpoint response)
bb7f19a fix: Dockerfile CMD use frontend/server.js, electron main.js use frontend/ path (standalone output has frontend/ prefix due to outputFileTracingRoot)
d8e3fe6 fix: use YAML folded block scalar for docker build command (no shell continuations)
a5d84ea fix: add Docker build ARGs for env, remove invalid electron-builder msix property
aa47361 fix: electron-build root deps use npm install, docker build context frontend/
c7fa5de fix: add preact dependency (needed by next-auth v5 beta, dropped by merge conflict)
a8caeee fix: migrate middleware.ts to proxy.ts (Next.js 16 deprecation)
76a7653 fix: build type errors, lint warnings, Docker/CI config for Drizzle
5447918 merge: remove obsolete prisma.config.ts (replaced by drizzle.config.ts)
446d35b feat: Prisma to Drizzle ORM migration + Phase 11 features + all tests passing
1768c2d fix: resolve build issues for deployment
2d9b6c2 fix: whitelist /api/auth/* routes in middleware
5077362 fix: resolve React 19 lint errors (set-state-in-effect, hydration toggle)
494e233 feat: production hardening - security, accessibility, observability, and test fixes
69582b8 feat: consolidate into frontend/, add Vercel & Docker deployment support
d848ce0 fix layout for deployment
7f4202d atlas working version
```

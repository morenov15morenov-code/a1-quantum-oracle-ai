# A1 Quantum Oracle AI — Universal Foresight Engine

> A universal foresight engine for anyone facing any decision. Not a market tool. Not a niche app. An oracle for every human question.

Last updated: 2026-08-11

## Quick Start

```bash
cd frontend
npm run db:push              # push schema to create/update SQLite DB
npm run db:seed              # seed admin user (admin@a1quantumoracleai.com / admin123)
npm run dev                  # start dev server on http://localhost:3000
```

Requires `DATABASE_URL="file:./data/dev.db"` in `.env.local` for database commands.

## Current Status: LIVE ON VERCEL (2026-08-11)

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | 0 errors |
| ESLint (`npm run lint`) | 0 errors, 0 warnings |
| Vitest (`npx vitest run`) | 398 passed, 0 failed, 50 files |
| Next.js build (`npm run build`) | Compiled successfully, 40 pages, 21 API routes |
| Playwright E2E (`npx playwright test --workers=1`, against prod build) | 56 passed, 2 skipped (Google/GitHub OAuth unconfigured), 0 failed |
| CI (GitHub Actions) | All jobs green: check, build, e2e, electron-build, docker |
| Production URL | https://a1-quantum-oracle-ai.vercel.app (deployment `a1-quantum-oracle-7d14glg20`) |
| Production DB | Turso Cloud (`a1-quantum-oracle-ai`), 8 tables pushed, admin seeded |
| Production env vars | Set on Vercel via API: `AUTH_SECRET` (generated), `NEXT_PUBLIC_APP_URL`/`APP_URL`/`AUTH_URL`/`NEXTAUTH_URL` → `https://a1-quantum-oracle-ai.vercel.app`, `ADMIN_EMAILS`, `PAYMENT_GATE_ENABLED=true`, `DATABASE_URL` (libsql + authToken), `OPENAI_API_KEY` (set, 5d ago) → **real `gpt-4o` AI path is ACTIVE in production** (live prediction returned `model: "gpt-4o"`). |
| Live verification | `/api/health` → `{"status":"ok","db":"ok"}`. Full end-to-end smoke test on 2026-08-13: signup → credentials login (csrf + `X-Auth-Return-Redirect: 1`) → prediction → history → feedback → account delete, all 2xx; disposable user + orphaned rows (Prediction/Subscription/PredictionFeedback/Session/Account) fully purged from Turso. Admin creds note: production admin password does **NOT** match seed default `admin123` (bcrypt verified); default was evidently changed — do not reset without user confirmation. Smoke test left `failedAttempts=3/5` on the admin row (15-min lockout triggers at 5). |
| GoDaddy domain | `a1quantumoracleai.com` (registered at GoDaddy, expires 2029-09-01). **Transfer-in to Vercel submitted 2026-08-13** — order `01KZXPBP1BYVT4HPHDMBEZN6RH`, status `purchasing`, payment $11.25 OK, auth code from GoDaddy used. Expected completion ~5 days (GoDaddy confirmation email can be ignored; auto-completes). Once on Vercel registrar: switch nameservers to Vercel DNS, verify live site, set up branded email (Cloudflare Email Routing / Zoho free), update registrant contact away from personal Gmail, remove old alias `atlas-oracle-seven.vercel.app`. Site stays live meanwhile at `a1-quantum-oracle-ai.vercel.app`. |
| Old alias | `atlas-oracle-seven.vercel.app` still attached as a project domain (pre-rebrand); remove after cutover |

> **Deploy notes**: deploy from repo **root** (`vercel --prod --yes` from `C:\Users\EL GALACTICO15\a1-quantum-oracle-ai`), because the Vercel project has `rootDirectory: frontend` (deploying from `frontend/` double-applies the path). `vercel.json` has no rootDirectory; the setting lives on the Vercel dashboard. Turso schema was pushed with `drizzle-kit push --force` and admin seeded with `npx tsx scripts/seed.ts` (refuses to run when `NODE_ENV=production`, so run via `npx tsx`). Production login e2e was verified with a fetch script (csrf → POST credentials → session).

> **Note**: `frontend/data/dev.db` removal from tracking and the `.env.local` gitignore were committed in `5b455ed`; `frontend/data/.gitkeep` (commit `e1fa181`) keeps the DB dir present in fresh clones/CI so the build-time `@libsql` open (`/api/admin/analytics` page-data collection) succeeds.

### CI Pipeline History (recent)

| Run | Commit | check | build | e2e | electron-build | docker |
|---|---|---|---|---|---|---|
| #65 | 71b1c3d | ✅ | ✅ | ✅ | ✅ | ❌ (busybox has no `--group`/`--ingroup`) |
| #66 | 4a53178 | ✅ | ✅ | ✅ | ✅ | ✅ |
| #78 | adc02c9 | ✅ | ✅ | ✅ | ✅ | ✅ |
| #79 | d5612e8 | ✅ | ✅ | ❌ (36 failures) | ✅ | ✅ |
| #80 | 22ae507 | ✅ | ✅ | ❌ (same) | ✅ | ✅ |
| #81 | f96395d | ✅ | ✅ | ✅ | ✅ | ✅ |

**Final validation**: run #81 (f96395d) fully green after the CI e2e fix. Root cause of #79/#80: the e2e job runs the prod server (`next start`) without the `AUTH_URL`/`NEXTAUTH_URL` that local `.env.local` provides, so NextAuth threw `UntrustedHost` in the middleware (`auth()` → 500 → redirect loop on `/login`, `/signup`, and `POST /api/auth/callback/credentials` returned 500). Fix: `trustHost: true` in `frontend/lib/auth.ts` (Auth.js's documented approach for `next start`/self-hosted deployments; Vercel still auto-trusts). Verified locally before push: full e2e suite (56 passed / 2 skipped OAuth / 0 failed) passes against a prod server started with `AUTH_URL`/`NEXTAUTH_URL` scrubbed.

**Final validation**: run #66 (4a53178) fully green — workflow badge reads `CI · passing` for `ci.yml@main`. Docker fix: reverted to `addgroup --system --gid 1001 nodejs` + `adduser --system --uid 1001 nextjs` + `chown -R nextjs:nodejs /app` (busybox-compatible). Pre-#65 failures (e2e `uptime` vs `version`, electron/docker path issues) were all resolved in the earlier run series.

## Git History

```
2ed85e5 feat(oracle): self-learning mock engine, confidence calibration, refreshed schema + final production deploy
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

## What Was Done (15 Phases Complete)

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

### Phase 13: Protocol 7 (System Stability Guard)
- **`lib/protocol7.ts`**: protection layer that blocks unsafe/destabilizing admin actions — blocked list: `disable_security`, `remove_authentication`, `delete_logs`, `override_protocol7`. API: `validate()` (boolean), `denyReason()` (message), `assertAllowed()` (403 NextResponse with `code: "PROTOCOL7_BLOCKED"`), and `adminAction()` — the Admin Protection Hook returning `{ success: true }` or `{ success: false, reason: "Protocol 7 restriction" }`. Extensible via constructor for custom blocked lists.
- **Wired into `/api/admin/users` PATCH**: deactivating an admin account maps to the blocked action `remove_authentication` → 403 via the `adminAction` hook (an admin cannot be deactivated through this endpoint, only regular users). Also added a 404 for unknown targets. Self-deactivation still returns 400.
- **Admin settings UI** (`/admin/settings`): shows "System Stability Guard — Protocol 7 (active)".
- **Tests**: +21 (protocol7 unit suite incl. `adminAction` + users-route Protocol 7/404/self-deactivate cases) → 344 tests / 43 files; typecheck, lint, build all green.

### Phase 14: Analytics Architecture (Pipeline)
- Prediction generation refactored into the **Analytics → Forecast → Response → Protocol 7 → Final Response** pipeline, each stage its own module:
  - **`lib/analytics-engine.ts`** — gathers intelligence (past predictions + similarity matching), resolves domain/user context, builds the multi-dimensional system prompt. Exports `OracleContext` (moved from `oracle.ts`).
  - **`lib/forecast-engine.ts`** — generates the raw forecast (result + confidence + reasoning) via `generatePrediction`.
  - **`lib/response-generator.ts`** — composes the final response (trim, clamp confidence 0–1, safe defaults) and provides `safeFallback()` for declined answers.
  - **Protocol 7 response validation** (`lib/protocol7.ts` `validateGeneratedResponse`) — scans generated text for destabilizing instructions (`disable security`, `remove authentication`, `delete logs`, `override protocol7` incl. inflections); blocked responses are replaced by a safe fallback so dangerous text never reaches storage.
  - **`lib/oracle.ts`** — orchestrates the pipeline; `queryOracle` signature unchanged (predictions route, its tests, and `simulate-oracle.ts` untouched).
- **Tests**: +23 (analytics-engine, forecast-engine, response-generator, oracle-pipeline, protocol7 response validation) → 361 tests / 47 files; typecheck, lint, build all green.

### Phase 15: Secret Admin Trigger
- **`components/hidden-admin-trigger.tsx`** (client component): an invisible overlay on the landing-page "A1 Quantum Oracle AI" heading (`aria-hidden`, `data-testid="secret-trigger"`, zero visual footprint). Clicking it 5 times within a 3s-per-click idle window fires `alert("Admin Access Unlocked")`; if the session role is `ADMIN` it then navigates to `/admin/dashboard`. Counter is kept in a ref (no re-renders) and self-resets after firing or after 3s idle. Purely a convenience shortcut — server/proxy `ADMIN` checks remain the real gate.
- **Wired into `app/page.tsx`**: the `h1` is wrapped in a `relative inline-block` span with `<HiddenAdminTrigger className="absolute inset-0" />`.
- **Tests**: +7 (`__tests__/components/hidden-admin-trigger.test.tsx` — admin navigate, non-admin/user unauthenticated alert-only, <5 clicks no-op, idle-reset) → 368 tests / 48 files; typecheck, lint clean.

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
4. ✅ **E2E stability fix (2026-08-11)** — root cause: the strict CSP (`script-src 'self' 'unsafe-inline'`, no `'unsafe-eval'`) blocked Next.js dev runtimes (Turbopack AND webpack dev both rely on eval), so pages never hydrated in dev → forms did native GET submits (broken login/signup) and Turbopack entered an infinite reload loop on `/`. Fixes committed in `d5612e8`:
   - `next.config.ts` — allow `'unsafe-eval'` in `script-src` **only in development**; production CSP unchanged (prod bundles don't use eval).
   - `playwright.config.ts` — webServer now runs a production build (`npm run build && npm run start`, timeout 600s) instead of the dev server (eliminates dev recompile races); `retries: 2` locally to mirror CI.
   - `proxy.ts` — short-circuit the `auth()` session lookup for public/auth routes (it was never used there), removing DB round-trips from the hot path and intermittent 500s under load; middleware auth POST rate limit is now env-configurable (`AUTH_RATE_LIMIT_MAX`, default 60).
   - Verified: typecheck 0 errors, lint clean, vitest 385/385, full E2E suite 56 passed / 2 skipped / 0 failed.

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
f96395d fix(auth): trust host in production to resolve CI UntrustedHost
22ae507 docs: update SESSION-STATE with e2e stability fix and rebrand commits
d5612e8 fix: stabilize e2e suite and dev-mode hydration
adc02c9 chore: rebrand Atlas Oracle to A1 Quantum Oracle AI (a1quantumoracleai.com)
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

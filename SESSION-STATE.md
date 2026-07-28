# Atlas Oracle — Universal Foresight Engine

> A universal foresight engine for anyone facing any decision. Not a market tool. Not a niche app. An oracle for every human question.

Last updated: 2026-07-28

## Quick Start

```bash
cd frontend
npm run db:push              # push schema to create/update SQLite DB
npm run db:seed              # seed admin user (admin@atlas-oracle.com / admin123)
npm run dev                  # start dev server on http://localhost:3000
```

Requires `DATABASE_URL="file:./prisma/dev.db"` in `.env.local` for database commands.

## Current Status: ALL GREEN

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | 0 errors |
| ESLint (`npm run lint`) | 0 errors, 0 warnings |
| Vitest (`npx vitest run`) | 293 passed, 0 failed, 37 files |
| Next.js build (`npm run build`) | Compiled successfully, 28 routes generated |
| Prisma → Drizzle Migration | Complete — all routes, tests, and configs updated |

## Git History

```
HEAD    feat: Prisma to Drizzle ORM migration + Phase 11 features
...
7f4202d atlas working version
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

## Key Architecture Decisions

- **Drizzle ORM over Prisma**: Lighter weight, better TypeScript inference, no code generation step, native LibSQL support
- **Conditional Sentry**: `next.config.ts` wraps `withSentryConfig` only when `SENTRY_AUTH_TOKEN` is set
- **React 19 lint**: `useFetch` uses `eslint-disable-line` for synchronous setState in effect
- **ThemeToggle**: Uses `useSyncExternalStore` for hydration-safe mounting pattern
- **Middleware**: Whitelists `/api/auth/*` from auth checks, adds rate limiting for POST requests
- **OAuth**: Conditional provider registration, auto-creates USER role on first login
- **Rate Limiting**: Two layers — middleware-level (20/min per IP) + per-route (signup: 3/min, login: 5/min)

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

## What's Left (Optional)

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

# A1 Quantum Oracle AI — System Architecture

## Overview

A1 Quantum Oracle AI is a full-stack universal foresight engine — not a market tool, not a niche app, but an oracle for every human question. Ask anything: career moves, relationship decisions, health choices, financial planning, creative pursuits, education paths, family matters, or business strategy. The Oracle delivers AI-powered predictions with confidence scores and transparent reasoning to anyone facing any decision.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 APP (App Router)                   │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Pages          │  │   API Routes    │  │   Middleware      │ │
│  │                  │  │                 │  │                   │ │
│  │  Landing Page    │  │  /api/health    │  │  Auth redirects   │ │
│  │  Login / Signup  │  │  /api/auth/*    │  │  Admin role check │ │
│  │  Dashboard       │  │  /api/predictions│ │  Public routes    │ │
│  │  History         │  │  /api/admin/*   │  │                   │ │
│  │  Prediction Detail│ │                 │  │                   │ │
│  │  Admin Panel     │  │                 │  │                   │ │
│  └────────┬─────────┘  └────────┬────────┘  └──────────────────┘ │
│           │                     │                                 │
│  ┌────────┴─────────────────────┴───────────────────────────────┐ │
│  │                    Shared Layer                               │ │
│  │  components/  lib/  types/  data/  scripts/                      │ │
│  └───────────────────────────┬──────────────────────────────────┘ │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
          │  SQLite  │  │  Auth.js │  │  OpenAI API  │
          │ (Drizzle)│  │  (JWT)   │  │ (or Mock)    │
         └──────────┘  └──────────┘  └──────────────┘
```

---

## Directory Structure

```
a1-quantum-oracle-ai/                          # Project root
├── frontend/                          # Next.js 16 application (self-contained)
│   ├── app/                           # App Router pages & API routes
│   │   ├── (auth)/                    # Login, Signup pages (centered layout)
│   │   ├── (user)/                    # Dashboard, History, Prediction detail
│   │   ├── admin/                     # Admin dashboard, Users, Predictions, Settings
│   │   ├── api/                       # API Route Handlers
│   │   │   ├── health/                # Health check
│   │   │   ├── auth/                  # NextAuth + Signup
│   │   │   ├── predictions/           # Create & list predictions
│   │   │   └── admin/                 # Admin analytics, users, predictions
│   │   ├── layout.tsx                 # Root layout (Providers, metadata)
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Tailwind CSS 4 theme tokens
│   │   ├── loading.tsx                # Root loading spinner
│   │   ├── error.tsx                  # Root error boundary
│   │   └── not-found.tsx              # 404 page
│   │
│   ├── components/                    # React components
│   │   ├── admin/                     # AnalyticsCharts, UserTable
│   │   ├── forms/                     # LoginForm, SignupForm, PredictionForm
│   │   ├── layout/                    # Navbar, Sidebar
│   │   ├── predictions/               # PredictionResultCard
│   │   ├── ui/                        # Button, Card, Input, Label, Select
│   │   └── providers.tsx             # SessionProvider wrapper
│   │
│   ├── lib/                           # Shared utilities
│   │   ├── ai.ts                      # AI prediction engine (OpenAI + mock)
│   │   ├── auth.ts                    # NextAuth + DrizzleAdapter
│   │   ├── schema.ts                  # Drizzle schema (8 tables)
│   │   ├── db.ts                      # Drizzle client singleton
│   │   ├── oracle.ts                  # Self-learning oracle (similarity, feedback)
│   │   ├── similarity.ts              # Cosine similarity engine
│   │   ├── projection.ts              # Multi-dimensional projection
│   │   ├── sr.ts                      # Statistical reasoning layer
│   │   ├── rate-limit.ts              # DB-backed rate limiter (RateLimit table)
│   │   ├── admin-guard.ts             # Admin RBAC guard
│   │   ├── email.ts                   # Resend email service
│   │   ├── logger.ts                  # Structured logger
│   │   ├── pagination.ts              # Pagination helpers
│   │   ├── use-fetch.ts               # React useFetch hook
│   │   ├── utils.ts                   # cn(), formatDate(), formatConfidence()
│   │   └── validations.ts             # Zod schemas
│   │
│   ├── types/                         # TypeScript type definitions
│   ├── drizzle/                       # Drizzle Kit migrations
│   ├── data/                          # SQLite database file (gitignored)
│   ├── scripts/                       # seed.ts + migrate.ts
│   ├── assets/                        # App icons
│   ├── e2e/                           # Playwright end-to-end tests
│   ├── __tests__/                     # Vitest unit/component tests
│   ├── proxy.ts                       # Next.js proxy (auth, RBAC, rate limiting)
│   ├── next.config.ts                 # Next.js configuration
│   ├── vitest.config.ts               # Vitest configuration
│   ├── playwright.config.ts           # Playwright configuration
│   ├── eslint.config.mjs              # ESLint flat config
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── postcss.config.mjs             # PostCSS (Tailwind CSS 4)
│   └── package.json                   # Dependencies & scripts
│
├── electron/                          # Electron desktop wrapper
│   └── main.js                        # Electron main process
├── docs/                              # Documentation
├── .github/workflows/                 # CI pipeline
├── package.json                       # Root: Electron + wrapper scripts
├── electron-builder.yml               # Electron builder config
├── AGENTS.md                          # Agent instructions
└── README.md                          # Project documentation
```

---

## Technology Stack

| Layer            | Technology                                |
|------------------|-------------------------------------------|
| Framework        | Next.js 16 (App Router, standalone)       |
| UI               | React 19, TypeScript 5 (strict)           |
| Styling          | Tailwind CSS 4                            |
| Authentication   | Auth.js v5 (Credentials, Google, GitHub OAuth, JWT) |
| Database ORM     | Drizzle ORM + LibSQL adapter             |
| Database         | SQLite                                    |
| AI Engine        | OpenAI GPT-4o (deterministic mock fallback)|
| Input Validation | Zod 4                                     |
| Unit Testing     | Vitest + @testing-library/react           |
| E2E Testing      | Playwright                                |
| Desktop          | Electron 33 + electron-builder            |
| CI/CD            | GitHub Actions                            |

---

## Data Flow

```
┌─────────────────────┐
│   Browser / Client   │
│   (React Components) │
└──────────┬──────────┘
           │ fetch() / Server Components
           ▼
┌─────────────────────┐     ┌──────────────────────┐
│   Next.js Middleware │────►│  Auth.js (JWT check)  │
│   (auth, RBAC)      │     └──────────────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────┐
│   API Route Handlers│────►│  Drizzle ORM          │────►│  SQLite  │
│   (server-side)     │◄────│  (LibSQL adapter)     │◄────│          │
└──────────┬──────────┘     └──────────────────────┘     └──────────┘
           │
           ▼
┌─────────────────────┐
│   AI Engine          │
│   (OpenAI / Mock)    │
└─────────────────────┘
```

---

## Security & Access Control

```
┌─────────────────────────────────────────────┐
│          Next.js Proxy (proxy.ts)            │
│                                             │
│  • Public routes: /, /login, /signup,       │
│    /verify-email, /privacy, /api/health     │
│  • Auth required: /dashboard, /history,     │
│    /settings, /prediction/*, /api/predictions│
│  • Admin required: /admin/*                 │
│  • Email-verified required: /api/predictions│
│    POST (when EMAIL_VERIFICATION_REQUIRED)  │
│  • Auth pages: /login, /signup              │
│    (redirect authenticated users away)      │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────────┐
│   USER Role     │  │   ADMIN Role        │
│                 │  │                     │
│ • Create        │  │ • All USER access   │
│   predictions   │  │ • User management   │
│ • View own      │  │ • All predictions   │
│   history       │  │ • Analytics         │
│ • Prediction    │  │ • Settings          │
│   detail        │  │                     │
└─────────────────┘  └─────────────────────┘
```

---

## API Endpoints

### System
- `GET /api/health` — Health check (public)
- `POST /api/sr` — Statistical reasoning endpoint (auth required)

### Auth
- `POST /api/auth/signup` — Create account (rate limited: 3/min per IP; gated by email verification when enabled)
- `POST /api/auth/verify-email` — Verify email via token (rate limited: 10/min)
- `POST /api/auth/resend-verification` — Resend verification email (rate limited: 3/min)
- `POST /api/auth/request-reset` — Request password reset (rate limited, anti-enumeration)
- `POST /api/auth/reset-password` — Reset password with token
- `POST /api/auth/[...nextauth]` — Auth.js sign in/out, session

### Predictions
- `POST /api/predictions` — Generate prediction (auth + verified email required when gated, rate limited: 10/min)
- `GET /api/predictions` — List user predictions (auth required, paginated)
- `POST /api/predictions/feedback` — Rate a prediction for accuracy feedback

### User
- `GET/PATCH /api/user/profile` — Read/update own profile
- `PATCH /api/user/password` — Change password
- `GET/PATCH /api/user/subscription` — Read/upgrade subscription (PRO gate)
- `DELETE /api/user/delete` — Permanently delete account + all data

### Admin
- `GET /api/admin/users` — List all users (admin only)
- `PATCH /api/admin/users` — Toggle user active status (admin only)
- `GET /api/admin/predictions` — List all predictions (admin only, paginated)
- `GET /api/admin/analytics` — Platform analytics (admin only)
- `GET/PATCH /api/admin/subscriptions` — Review/approve PRO upgrade requests (admin only)

---

## Database Schema (Drizzle ORM) — 8 tables (`lib/schema.ts`)

- **User** — id, name, email, emailVerified, password (bcrypt), role (USER/ADMIN), active, failedAttempts, lockedUntil, passwordResetToken/Expires, emailVerifyToken/Expires, timestamps
- **Prediction** — id, userId (FK), input, result, confidence, reasoning, model, domain, tokensIn/Out, createdAt
- **PredictionFeedback** — id, predictionId (FK), userId (FK), accurate, comment, createdAt
- **Subscription** — id, userId (FK), tier (FREE/PRO), status (ACTIVE/PENDING/REJECTED), periodEnd, createdAt
- **RateLimit** — id, key, count, resetAt (atomic upsert, DB-backed rate limiting)
- **AnalyticsEvent** — id, event, userId (optional), metadata, createdAt
- **Account** — standard Auth.js adapter model
- **Session** — standard Auth.js adapter model

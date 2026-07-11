# Atlas Oracle — System Architecture

## Overview

Atlas Oracle is a full-stack AI-powered prediction and forecasting application built as a monolithic Next.js 16 App Router application with API routes, Auth.js authentication, Prisma ORM, and an optional Electron desktop wrapper.

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
│  │  components/  lib/  types/  prisma/  scripts/                 │ │
│  └───────────────────────────┬──────────────────────────────────┘ │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │  SQLite  │  │  Auth.js │  │  OpenAI API  │
         │ (Prisma) │  │  (JWT)   │  │ (or Mock)    │
         └──────────┘  └──────────┘  └──────────────┘
```

---

## Directory Structure

```
atlas-oracle/                          # Project root
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
│   │   ├── auth.ts                    # NextAuth configuration
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── rate-limit.ts              # In-memory rate limiter
│   │   ├── use-fetch.ts               # React useFetch hook
│   │   ├── utils.ts                   # cn(), formatDate(), formatConfidence()
│   │   └── validations.ts             # Zod schemas
│   │
│   ├── types/                         # TypeScript type definitions
│   ├── prisma/                        # Prisma schema & SQLite database
│   ├── scripts/                       # Database seed script
│   ├── assets/                        # App icons
│   ├── e2e/                           # Playwright end-to-end tests
│   ├── __tests__/                     # Vitest unit/component tests
│   ├── middleware.ts                   # Next.js middleware (auth, RBAC)
│   ├── next.config.ts                 # Next.js configuration
│   ├── vitest.config.ts               # Vitest configuration
│   ├── playwright.config.ts           # Playwright configuration
│   ├── eslint.config.mjs              # ESLint flat config
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── postcss.config.mjs             # PostCSS (Tailwind CSS 4)
│   ├── prisma.config.ts               # Prisma 7 configuration
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
| Authentication   | Auth.js v5 (Credentials, JWT strategy)    |
| Database ORM     | Prisma 7 + LibSQL adapter                 |
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
│   API Route Handlers│────►│  Prisma ORM           │────►│  SQLite  │
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
│          Next.js Middleware                  │
│                                             │
│  • Public routes: /, /api/health            │
│  • Auth required: /dashboard, /history,     │
│    /prediction/*, /api/predictions          │
│  • Admin required: /admin/*                 │
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

### Auth
- `POST /api/auth/signup` — Create account (rate limited: 3/min per IP)
- `POST /api/auth/[...nextauth]` — Auth.js sign in/out, session

### Predictions
- `POST /api/predictions` — Generate prediction (auth required, rate limited: 10/min)
- `GET /api/predictions` — List user predictions (auth required, paginated)

### Admin
- `GET /api/admin/users` — List all users (admin only)
- `PATCH /api/admin/users` — Toggle user active status (admin only)
- `GET /api/admin/predictions` — List all predictions (admin only, paginated)
- `GET /api/admin/analytics` — Platform analytics (admin only)

---

## Database Schema

- **User** — id, name, email, password (bcrypt), role (USER/ADMIN), active, timestamps
- **Prediction** — id, userId (FK), input, result, confidence, reasoning, model, tokensIn/Out, createdAt
- **AnalyticsEvent** — id, event, userId (optional), metadata, createdAt
- **Account** — standard Auth.js adapter model
- **Session** — standard Auth.js adapter model

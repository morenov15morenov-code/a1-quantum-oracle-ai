# A1 Quantum Oracle AI

**A universal foresight engine for anyone facing any decision.**

Ask any question — career moves, relationship choices, health decisions, financial planning, creative pursuits, education paths, family matters, business strategy — and receive AI-powered predictions with confidence scores and transparent reasoning.

Not a market tool. Not a niche app. An oracle for every human question.

Built with Next.js 16, React 19, Auth.js, Drizzle ORM (SQLite/Turso), and OpenAI GPT-4o.

---

## Table of Contents

- [Quick Start](#quick-start)
- [User Guide](#user-guide)
  - [Creating an Account](#1-creating-an-account)
  - [Signing In](#2-signing-in)
  - [Making a Prediction](#3-making-a-prediction)
  - [Viewing Recent Predictions](#4-viewing-recent-predictions)
  - [Browsing History](#5-browsing-history)
  - [Viewing a Single Prediction](#6-viewing-a-single-prediction)
- [Admin Guide](#admin-guide)
  - [Accessing the Admin Panel](#1-accessing-the-admin-panel)
  - [Dashboard Overview](#2-dashboard-overview)
  - [Managing Users](#3-managing-users)
  - [Viewing All Predictions](#4-viewing-all-predictions)
  - [Platform Settings](#5-platform-settings)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Set up environment
copy .env.example .env.local

# Push the schema to create/update the database
npm run db:push

# Seed the admin user
npm run db:seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default admin credentials:**
Email: `admin@a1quantumoracleai.com`
Password: `admin123`

---

## User Guide

### 1. Creating an Account

1. Navigate to `/signup` or click **Get Started** on the landing page.
2. Fill in:
   - **Name** — at least 2 characters
   - **Email** — a valid email address
   - **Password** — at least 6 characters
   - **Confirm Password** — must match password
3. Click **Create Account**.
4. On success, you are automatically signed in and redirected to `/dashboard`.

Errors (e.g., short password, existing email) appear as a red banner below the form.

### 2. Signing In

1. Navigate to `/login` or click **Sign In** on the landing page.
2. Enter your email and password.
3. Click **Sign In**.
4. On success, you are redirected to `/dashboard`.

If you see *"Invalid email or password"*, check your credentials or create a new account.

### 3. Making a Prediction

On the **Dashboard** (`/dashboard`):

1. Type a question into the textarea (10–2000 characters).
   - Example: *"Should I leave my corporate job to pursue UX design?"*
   - Example: *"Will this startup idea succeed in the current market?"*
   - Example: *"Is it the right time to buy a house?"*
   - Example: *"Should I move to a new city for a fresh start?"*
   - Example: *"Will my child adjust well to the new school?"*
2. A character counter shows your progress (`X/2000`).
3. Click **Generate Prediction**.
4. Wait a few seconds while the AI generates a response.
5. The result appears immediately in the **Recent Predictions** section below the form.

Each prediction displays:
- **Your Question** — the original input
- **Prediction** — the AI-generated forecast
- **Confidence** — a percentage with a color-coded dot (green ≥ 80%, yellow ≥ 60%, red < 60%)
- **Reasoning** — the AI's explanation for its forecast
- **Model** — the AI model used (e.g., `gpt-4o` or `mock`)
- **Date/Time** — when the prediction was made

If no OpenAI API key is configured, predictions use a deterministic mock engine. Results are still useful for testing the full workflow.

### 4. Viewing Recent Predictions

Your **Dashboard** shows the 5 most recent predictions. After making a new prediction, the list refreshes automatically.

### 5. Browsing History

The **History** page (`/history`) shows all predictions you have ever made, paginated at 20 per page. Use **Previous** / **Next** to navigate pages. Click any prediction card to view its detail page.

### 6. Viewing a Single Prediction

Each prediction has a dedicated page at `/prediction/[id]`. You can reach it by:
- Clicking a prediction card on the Dashboard or History page
- Navigating directly to its URL (must be your own prediction)

---

## Admin Guide

The admin panel is accessible only to users with the `ADMIN` role. The seed script creates one admin account by default.

### 1. Accessing the Admin Panel

1. Sign in with the admin account (or any account promoted to `ADMIN` role).
2. Click the **Admin** button in the top navbar (visible only to admins).
3. You are taken to `/admin/dashboard`.

The admin panel has its own sidebar navigation with four sections.

### 2. Dashboard Overview

The **Admin Dashboard** (`/admin/dashboard`) shows platform-wide analytics:

- **Stat Cards** at the top:
  - Total Users — number of registered accounts
  - Total Predictions — number of predictions made
  - Active Users — users with `active = true`
  - Average Confidence — mean confidence across all predictions
- **Predictions (Last 30 Days)** — bar chart of daily prediction volume
- **New Users (Last 30 Days)** — bar chart of daily signups
- **Top Models** — ranked list of AI models used (e.g., `gpt-4o`, `mock`)
- **Top Users by Predictions** — users who have made the most predictions

### 3. Managing Users

The **Users** page (`/admin/users`) lists every registered user with:
- Name, Email
- Role badge (USER / ADMIN)
- Status indicator (green dot = Active, red dot = Inactive)
- Join date
- **Toggle Active/Inactive** button

To disable a user's login access, click **Deactivate**. Their status updates immediately. Reactivate them the same way. Deactivated users cannot sign in.

### 4. Viewing All Predictions

The **Predictions** page (`/admin/predictions`) shows every prediction made on the platform in a paginated table with:
- User who made the prediction
- Input text (truncated)
- Confidence percentage
- Model name
- Date created

### 5. Platform Settings

The **Settings** page (`/admin/settings`) displays read-only platform information:
- App version
- Environment (development / production)
- AI Model — shows "GPT-4o" if `OPENAI_API_KEY` is configured, otherwise "Mock (no API key set)"
- Database — SQLite or Turso

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (see [Database](#database)) |
| `AUTH_SECRET` | Yes | Random string for JWT encryption (generate with `openssl rand -base64 32`) |
| `OPENAI_API_KEY` | No | OpenAI API key for GPT-4o predictions; omit to use mock predictions |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the app (e.g., `http://localhost:3000` or `https://your-app.vercel.app`) |
| `RESEND_API_KEY` | No | Resend API key for email delivery (password reset, welcome emails) |
| `RESEND_FROM_EMAIL` | No | Sender address for emails (default: `A1 Quantum Oracle AI <noreply@a1quantumoracleai.com>`) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token (enables webpack plugin during build) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (both ID and secret required) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID (both ID and secret required) |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |

---

## Database

A1 Quantum Oracle AI uses **Drizzle ORM** with the **LibSQL adapter**.

### Local Development (SQLite)

No setup required. The default `DATABASE_URL` points to a local SQLite file:

```
DATABASE_URL="file:./data/dev.db"
```

```bash
# Push schema to create/update the database
npm run db:push

# Open Drizzle Studio to browse data
npm run db:studio

# Seed the admin user
npm run db:seed
```

### Production (Turso)

For Vercel and other serverless platforms, use **Turso** (free tier available):

1. Sign up at [turso.tech](https://turso.tech)
2. Install the Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
3. Log in: `turso auth login`
4. Create a database: `turso db create a1-quantum-oracle-ai`
5. Get the URL: `turso db show a1-quantum-oracle-ai --url`
6. Create an auth token: `turso db tokens create a1-quantum-oracle-ai`
7. Set `DATABASE_URL` in Vercel:
   ```
   libsql://your-db-name-your-org.turso.io?authToken=your-token
   ```
8. Push the schema: `npm run db:push`

No code changes needed — the app auto-detects Turso from the `DATABASE_URL`.

### Models

- **User** — id, name, email, hashed password, role (USER/ADMIN), active boolean, timestamps
- **Prediction** — id, input, result, confidence, reasoning, model, userId, timestamps
- **Subscription** — id, userId, tier (FREE/PRO), predsUsed, predsLimit, period dates
- **PredictionFeedback** — id, predictionId, userId, rating, wasAccurate, comment, domain
- **AnalyticsEvent** — id, event type, userId (optional), metadata, timestamp
- **Account / Session** — standard Auth.js models

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite includes:
- **Unit tests**: utility functions, Zod validations, mock AI engine, rate limiter
- **Component tests**: button, card, input, label, select, forms, layout, admin components
- **API tests**: auth, predictions, admin endpoints
- **Middleware tests**: auth redirects, RBAC

All tests use Vitest with jsdom and `@testing-library/react`.

---

## Deployment

### Vercel (recommended)

1. Push the project to a GitHub repository.

2. Import the repo into [vercel.com](https://vercel.com).

3. **Configure the project root** to `frontend` in Vercel project settings (Settings > General > Root Directory).

4. Set environment variables in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `libsql://your-db.turso.io?authToken=your-token` |
   | `AUTH_SECRET` | Random 32+ char string (run `openssl rand -base64 32`) |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
   | `OPENAI_API_KEY` | _(optional)_ `sk-proj-...` |

5. Click **Deploy**.

6. After first deploy, seed the admin user via Vercel CLI:
   ```bash
   npx vercel env pull .env.local
   npm run db:push
   npm run db:seed
   ```

### Docker

```bash
docker compose up -d
```

Or manually:

```bash
cd frontend
docker build -t a1-quantum-oracle-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  -e AUTH_SECRET="your-secret" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  a1-quantum-oracle-ai
```

### Build locally

```bash
cd frontend
npm run build
npm start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, standalone output) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Auth | Auth.js v5 (NextAuth) with Credentials + Google/GitHub OAuth |
| Database ORM | Drizzle ORM + LibSQL adapter |
| Database | SQLite (local) / Turso (production) |
| AI | OpenAI GPT-4o (with mock fallback) |
| Testing | Vitest + Testing Library + Playwright |
| Desktop | Electron 33 + electron-builder |
| Language | TypeScript 5 (strict mode) |

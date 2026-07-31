FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder ---
FROM base AS builder
ARG DATABASE_URL
ARG AUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ENV DATABASE_URL=${DATABASE_URL:-file:./data/dev.db}
ENV AUTH_SECRET=${AUTH_SECRET:-local-build-secret-not-for-production}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 --group nodejs
RUN adduser --system --uid 1001 --ingroup nodejs nextjs

# Install drizzle-kit for schema push at startup
RUN npm install -g drizzle-kit@^0.31.10

# Copy build output and runtime deps
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/lib/schema.ts ./lib/schema.ts
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD sh -c "mkdir -p /app/data && drizzle-kit push --config=drizzle.config.ts 2>/dev/null || true && npx next start"

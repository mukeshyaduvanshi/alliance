# ─── Build stage ─────────────────────────────────────────────
FROM node:24-alpine AS builder

# Install pnpm explicitly (corepack unreliable on Railway)
RUN npm install -g pnpm@11.13.1

WORKDIR /app

# 1. Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# 2. Copy package manifests for dependency resolution
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/

# 3. Install all workspace dependencies
RUN pnpm install --frozen-lockfile=false

# 4. Copy source code
COPY packages/database packages/database
COPY packages/types packages/types
COPY packages/config packages/config
COPY apps/backend apps/backend

# 5. Generate Prisma client
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
RUN rm -f packages/database/prisma.config.ts && cd packages/database && ../../node_modules/.bin/prisma generate

# 6. Build backend
RUN pnpm --filter backend build

# ─── Production stage ────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 4000

CMD ["node", "apps/backend/dist/main.js"]

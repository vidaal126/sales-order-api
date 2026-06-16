# ─── base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json yarn.lock ./
COPY prisma.config.ts ./
COPY src/infrastructure/database/prisma ./src/infrastructure/database/prisma/

# ─── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
RUN yarn install --frozen-lockfile --ignore-scripts

# ─── development ──────────────────────────────────────────────────────────────
FROM base AS development
RUN mkdir -p /app/dist /app/node_modules /app/src/infrastructure/database/prisma/generated && \
    chown -R node:node /app
USER node
COPY --chown=node:node docker/entrypoint-development.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

# ─── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN yarn build
RUN yarn install --production --frozen-lockfile --ignore-scripts

# ─── production ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
ARG ENVIRONMENT=production
ENV NODE_ENV=${ENVIRONMENT}
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nestjs
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nestjs:nodejs /app/src/infrastructure/database/prisma ./src/infrastructure/database/prisma
USER nestjs
EXPOSE 8080
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]

FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY scripts ./scripts
COPY tsconfig.base.json turbo.json ./
RUN npm ci --include=dev
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate --schema=prisma/schema.prisma
RUN cd /app/apps/api && ./node_modules/.bin/nest build
RUN cd /app/apps/web && ../../node_modules/.bin/next build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV API_PORT=3001
ENV API_INTERNAL_URL=http://127.0.0.1:3001

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "scripts/start-production.mjs"]

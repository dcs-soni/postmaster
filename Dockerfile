FROM oven/bun:1 AS web-builder

WORKDIR /app/web

COPY bun.lock /app/
COPY apps/web/package.json ./
RUN bun install

COPY apps/web/ ./

ARG VITE_PROXY_URL=http://localhost:3000/api/proxy
ENV VITE_PROXY_URL=$VITE_PROXY_URL

RUN bun run build



FROM oven/bun:1 AS api-builder

WORKDIR /app/api

COPY apps/api/package.json apps/api/bun.lock ./
RUN bun install --production



FROM oven/bun:1-slim AS production

WORKDIR /app

# Install curl for healthcheck and remove apt cache to keep image small
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    bun add -g serve

COPY --from=api-builder /app/api/node_modules ./apps/api/node_modules
COPY apps/api/src ./apps/api/src
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

COPY --from=web-builder /app/web/dist ./apps/web/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "cd /app/apps/api && bun run start & serve -s /app/apps/web/dist -l 5173 --no-clipboard"]

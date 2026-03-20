FROM node:24-slim AS build

LABEL org.opencontainers.image.source=https://github.com/hmbanan666/chatgame
LABEL org.opencontainers.image.description="Chat Game for Twitch"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/website ./apps/website

RUN corepack enable pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @chatgame/website build

FROM node:24-slim
WORKDIR /app

RUN chown node:node /app
USER node

COPY --from=build --chown=node:node /app/apps/website/.output .output
COPY --from=build --chown=node:node /app/packages/database/migrations ./migrations

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

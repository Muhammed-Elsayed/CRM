# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
ENV NODE_ENV=development
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientflow_crm?schema=public" npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientflow_crm?schema=public" npm run prisma:generate
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientflow_crm?schema=public" npm ci --omit=dev \
  && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientflow_crm?schema=public" npm run prisma:generate \
  && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]

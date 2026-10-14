FROM node:22-alpine AS builder

WORKDIR /app

# Copia dependências e fontes
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/game/package.json ./apps/game/
COPY apps/admin/package.json ./apps/admin/

RUN npm install

COPY . .

# Constrói pacotes compartilhados, servidor e frontends
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/game/package.json ./apps/game/
COPY apps/admin/package.json ./apps/admin/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/game/dist ./apps/game/dist
COPY --from=builder /app/apps/admin/dist ./apps/admin/dist

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]

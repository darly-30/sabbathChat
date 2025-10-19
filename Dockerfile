FROM node:18-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN npm i -g pnpm@8

# Copiar dependencias primero (para aprovechar la cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar todo y hacer build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


# --- Runner ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Crear usuario sin privilegios
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copiar solo lo necesario para producción
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
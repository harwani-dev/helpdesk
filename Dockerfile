# ---------- BUILD ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build


# ---------- RUNTIME ----------
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate   

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/server.js"]

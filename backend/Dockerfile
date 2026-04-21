FROM node:24-alpine3.23 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY vitest.config.ts ./

RUN npm run prisma:generate
RUN npm run build

FROM node:24-alpine3.23 AS runtime

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:seed && npm run start"]

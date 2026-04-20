FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY vitest.config.ts ./

RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:seed && npm run start"]

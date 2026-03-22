
FROM node:lts-alpine3.22 AS builder

WORKDIR /server

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:lts-alpine3.22 AS production

WORKDIR /server

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /server/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
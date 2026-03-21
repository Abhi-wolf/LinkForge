
FROM node:lts-alpine3.22 AS builder

WORKDIR /server

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine3.22 AS development

WORKDIR /server_prod

COPY package*.json ./

RUN npm ci

COPY --from=builder /server/dist ./dist

CMD ["npm","start"]
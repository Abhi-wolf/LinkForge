
FROM node:lts-alpine3.22 AS builder

WORKDIR /url_shortener_build

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine3.22 AS development

WORKDIR /url_shortener_prod

COPY package*.json ./

RUN npm ci

COPY --from=builder /url_shortener_build/dist ./dist

CMD ["npm","start"]
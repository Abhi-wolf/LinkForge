

FROM node:lts-alpine3.22 AS builder

WORKDIR /app

# Copy server first (needed for tRPC types)
COPY server/package*.json ./server/
RUN cd server && npm install

COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source
COPY server ./server
COPY client ./client

# Build client
RUN cd client && npm run build

# Stage 2: Serve
FROM node:lts-alpine3.22

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/client/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
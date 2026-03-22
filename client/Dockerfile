FROM node:lts-alpine3.22 AS builder

WORKDIR /app

# Copy server package files first (needed for tRPC types)
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy client package files
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy both server and client source
COPY server ./server
COPY client ./client

# Build client
RUN cd client && npm run build

# Production stage
FROM node:lts-alpine3.22

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/client/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]


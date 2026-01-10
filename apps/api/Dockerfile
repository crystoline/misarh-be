# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/

# Copy API source
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm install

# Build shared packages first
RUN npm run build --workspace=packages/shared

# Build API
RUN npm run build --workspace=apps/api

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built files from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm install --production --workspace=apps/api

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]

# Multi-stage build for Craftique Backend
# Stage 1: Dependencies
# Using Node.js 20 (latest LTS) with security fixes for zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
FROM node:20-slim AS deps

WORKDIR /app

# Update system packages including zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends zlib1g libpam-runtime libpam-modules && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (needed for Prisma generation)
RUN npm ci && npm cache clean --force

# Stage 2: Build
# Using Node.js 20 (latest LTS) with security fixes for zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
FROM node:20-slim AS builder

# Update system packages including zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends zlib1g libpam-runtime libpam-modules && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 3: Production
# Using Node.js 20 (latest LTS) with security fixes for zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
FROM node:20-slim AS runner

WORKDIR /app

# Update system packages including zlib (CVE-2023-45853), linux-pam (CVE-2025-8941), and install OpenSSL for Prisma
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends openssl zlib1g libpam-runtime libpam-modules && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies + Prisma CLI for migrations
RUN npm ci --only=production && \
    npm install prisma --save-dev && \
    npm cache clean --force

# Copy built application and Prisma schema from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Generate Prisma client for the production platform
RUN npx prisma generate

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Set user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]


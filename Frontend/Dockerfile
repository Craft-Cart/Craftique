# Multi-stage build for Craftique Frontend
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

# Install dependencies (use legacy-peer-deps to handle React 19 compatibility)
RUN npm ci --legacy-peer-deps

# Stage 2: Build
# Using Node.js 20 (latest LTS) with security fixes for zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
FROM node:20-slim AS builder

# Update system packages including zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends zlib1g libpam-runtime libpam-modules && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config
COPY . .

# Set build-time environment variable (if needed)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build Next.js application
RUN npm run build

# Stage 3: Production
# Using Node.js 20 (latest LTS) with security fixes for zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Update system packages including zlib (CVE-2023-45853) and linux-pam (CVE-2025-8941)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends zlib1g libpam-runtime libpam-modules && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]


# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json pnpm-lock.yaml* ./
RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

# Copy app source code
COPY . .

# Build Next.js app
RUN pnpm build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json pnpm-lock.yaml* ./
RUN npm install -g pnpm \
    && pnpm install --prod --frozen-lockfile

# Copy built Next.js app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]

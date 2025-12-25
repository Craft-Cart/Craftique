# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN pnpm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built app and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose the server port
EXPOSE 3000

# Set environment variables (override in deployment)
ENV NODE_ENV=production
ENV PORT=3000

# Start the backend server
CMD ["node", "dist/server.js"]

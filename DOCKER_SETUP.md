# Docker Setup Guide for Craftique

This guide explains how to run the Craftique e-commerce platform using Docker containers.

## 📦 Containers Overview

The application consists of **3 main containers**:

1. **PostgreSQL** - Database server
2. **Backend** - Node.js/Express API server
3. **Frontend** - Next.js application

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Step 1: Clone and Navigate

```bash
cd Craftique
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.docker.example .env
```

Edit `.env` and fill in your actual values:
- Auth0 credentials
- Paymob credentials
- JWT and cookie secrets
- Other configuration

**Important:** Generate secure secrets:
```bash
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For COOKIE_SECRET
openssl rand -base64 64  # For PAYMOB_HMAC_SECRET
```

### Step 3: Build and Start Containers

```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Step 4: Run Database Migrations

The backend container will automatically run migrations on startup. If you need to run them manually:

```bash
# Access backend container
docker-compose exec backend sh

# Inside container, run:
npx prisma migrate deploy
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/v1
- **Health Check:** http://localhost:8000/health
- **PostgreSQL:** localhost:5432 (if exposed)

## 📋 Container Details

### 1. PostgreSQL Container

**Image:** `postgres:15-alpine`

**Configuration:**
- Database: `craftique`
- User: `craftique`
- Password: `craftique_password_change_in_production` (⚠️ Change in production!)
- Port: `5432`
- Data persisted in Docker volume: `postgres_data`

**Environment Variables (in docker-compose.yml):**
```yaml
POSTGRES_USER: craftique
POSTGRES_PASSWORD: craftique_password_change_in_production
POSTGRES_DB: craftique
```

### 2. Backend Container

**Base Image:** `node:18-alpine`

**Multi-stage Build:**
1. **deps** - Install production dependencies
2. **builder** - Build TypeScript, generate Prisma client
3. **runner** - Production runtime

**Port:** `8000`

**Health Check:** `/health` endpoint

**Dependencies:**
- Waits for PostgreSQL to be healthy
- Runs Prisma migrations on startup

**Environment Variables:**
- See `Backend/.env.example` for all variables
- Can be overridden via `.env` file or docker-compose.yml

### 3. Frontend Container

**Base Image:** `node:18-alpine`

**Multi-stage Build:**
1. **deps** - Install dependencies
2. **builder** - Build Next.js application
3. **runner** - Production runtime (standalone mode)

**Port:** `3000`

**Health Check:** Root endpoint

**Dependencies:**
- Waits for backend to be ready

**Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

## 🔧 Development Mode

For development with hot reload, use the development override:

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f backend frontend
```

**Note:** Development mode mounts source code as volumes for hot reload.

## 📝 Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Execute Commands in Containers

```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# PostgreSQL container
docker-compose exec postgres psql -U craftique -d craftique
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio
# Then access at http://localhost:5555 (if port is exposed)
```

### Rebuild Containers

```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

### Stop and Remove

```bash
# Stop containers (keeps volumes)
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

## 🔒 Production Considerations

### 1. Environment Variables

- Use strong, randomly generated secrets
- Never commit `.env` files
- Use Docker secrets or environment variable management tools

### 2. Database Security

- Change default PostgreSQL password
- Use strong database credentials
- Consider using Docker secrets for passwords
- Enable SSL/TLS for database connections

### 3. Network Security

- Use reverse proxy (Nginx/Traefik) in front
- Enable HTTPS
- Configure proper CORS settings
- Use internal Docker networks (already configured)

### 4. Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 5. Health Checks

Health checks are already configured. Monitor with:

```bash
docker-compose ps
```

### 6. Logging

Configure log rotation in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🐛 Troubleshooting

### Backend won't start

1. Check database connection:
```bash
docker-compose exec backend sh
npx prisma db pull
```

2. Check logs:
```bash
docker-compose logs backend
```

3. Verify environment variables:
```bash
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend can't connect to backend

1. Check `NEXT_PUBLIC_API_BASE_URL`:
```bash
docker-compose exec frontend env | grep NEXT_PUBLIC_API_BASE_URL
```

2. Verify backend is running:
```bash
curl http://localhost:8000/health
```

3. Check network connectivity:
```bash
docker-compose exec frontend wget -O- http://backend:8000/health
```

### Database connection issues

1. Check PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

2. Test connection:
```bash
docker-compose exec postgres psql -U craftique -d craftique -c "SELECT 1;"
```

3. Check database URL format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

### Port conflicts

If ports 3000, 8000, or 5432 are already in use:

1. Change ports in `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Change host port
```

2. Update environment variables accordingly.

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Review this guide and project documentation


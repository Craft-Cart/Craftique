# Docker Containers Required for Craftique

## 📦 Container Overview

The Craftique e-commerce platform requires **3 Docker containers** to run:

### 1. **PostgreSQL Database Container**
- **Image:** `postgres:15-alpine`
- **Purpose:** Stores all application data (users, items, orders, reviews, etc.)
- **Port:** `5432` (internal), exposed to host for development
- **Volume:** `postgres_data` (persistent storage)
- **Health Check:** Yes (pg_isready)
- **Why needed:** Prisma ORM requires PostgreSQL database

### 2. **Backend API Container**
- **Image:** Custom build from `Backend/Dockerfile`
- **Base:** `node:18-alpine`
- **Purpose:** Serves the REST API (Express/TypeScript)
- **Port:** `8000`
- **Health Check:** Yes (`/health` endpoint)
- **Dependencies:** Waits for PostgreSQL to be healthy
- **Why needed:** Core application logic, authentication, payment processing

### 3. **Frontend Application Container**
- **Image:** Custom build from `Frontend/Dockerfile`
- **Base:** `node:18-alpine`
- **Purpose:** Serves the Next.js web application
- **Port:** `3000`
- **Health Check:** Yes (root endpoint)
- **Dependencies:** Waits for backend to be ready
- **Why needed:** User interface, client-side application

## 🔗 Container Communication

```
┌─────────────┐
│  Frontend   │ ──HTTP──> │  Backend   │ ──SQL──> │ PostgreSQL │
│  (Port 3000)│           │ (Port 8000)│          │ (Port 5432)│
└─────────────┘           └────────────┘          └────────────┘
     │                            │                       │
     └────────────────────────────┴───────────────────────┘
                    Docker Network: craftique-network
```

All containers communicate through a Docker bridge network (`craftique-network`).

## 📋 Container Details

### PostgreSQL Container

**Configuration:**
```yaml
Container Name: craftique-postgres
Image: postgres:15-alpine
Database: craftique
User: craftique
Password: craftique_password_change_in_production
Port Mapping: 5432:5432
Volume: postgres_data:/var/lib/postgresql/data
```

**Environment Variables:**
- `POSTGRES_USER=craftique`
- `POSTGRES_PASSWORD=craftique_password_change_in_production`
- `POSTGRES_DB=craftique`
- `PGDATA=/var/lib/postgresql/data/pgdata`

**Data Persistence:**
- Data stored in Docker volume `postgres_data`
- Survives container restarts
- Can be backed up/restored

### Backend Container

**Configuration:**
```yaml
Container Name: craftique-backend
Base Image: node:18-alpine
Build Context: ./Backend
Port Mapping: 8000:8000
Depends On: postgres (health check)
```

**Build Stages:**
1. **deps** - Install all dependencies
2. **builder** - Generate Prisma client, compile TypeScript
3. **runner** - Production runtime (production dependencies only)

**Key Features:**
- Multi-stage build for smaller image size
- Runs as non-root user (security)
- Automatic Prisma migrations on startup
- Health check endpoint

**Environment Variables:**
- Database connection string
- Auth0 credentials
- JWT secrets
- Paymob credentials
- Security settings

### Frontend Container

**Configuration:**
```yaml
Container Name: craftique-frontend
Base Image: node:18-alpine
Build Context: ./Frontend
Port Mapping: 3000:3000
Depends On: backend
```

**Build Stages:**
1. **deps** - Install dependencies
2. **builder** - Build Next.js application (standalone mode)
3. **runner** - Production runtime

**Key Features:**
- Next.js standalone output for smaller image
- Runs as non-root user (security)
- Health check endpoint

**Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- Auth0 public variables (if used on frontend)

## 🚫 External Services (Not Containerized)

These services are **external** and not included in Docker:

1. **Auth0** - Authentication service (SaaS)
   - Used for: User authentication, JWT tokens
   - Configuration: Via environment variables

2. **Paymob** - Payment gateway (SaaS)
   - Used for: Payment processing
   - Configuration: Via environment variables

3. **SendGrid** - Email service (SaaS, optional)
   - Used for: Transactional emails
   - Configuration: Via environment variables

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host Machine                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Docker Network: craftique-network           │  │
│  │                                                       │  │
│  │  ┌──────────────┐    ┌──────────────┐               │  │
│  │  │  Frontend     │───▶│  Backend     │               │  │
│  │  │  :3000        │    │  :8000       │               │  │
│  │  └──────────────┘    └──────┬───────┘               │  │
│  │                             │                         │  │
│  │                             ▼                         │  │
│  │                    ┌──────────────┐                │  │
│  │                    │  PostgreSQL      │                │  │
│  │                    │  :5432           │                │  │
│  │                    └──────────────────┘                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              External Services (SaaS)                  │  │
│  │  • Auth0 (Authentication)                              │  │
│  │  • Paymob (Payments)                                  │  │
│  │  • SendGrid (Email, optional)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Resource Requirements

### Minimum Requirements:
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 10GB (for images and volumes)

### Recommended Requirements:
- **CPU:** 4 cores
- **RAM:** 4GB
- **Disk:** 20GB

### Container Resource Usage (Approximate):
- **PostgreSQL:** ~200MB RAM, 1GB disk
- **Backend:** ~150MB RAM, 500MB disk
- **Frontend:** ~100MB RAM, 300MB disk

## 🔄 Container Lifecycle

### Startup Order:
1. **PostgreSQL** starts first
2. **Backend** waits for PostgreSQL health check, then starts
3. **Frontend** waits for backend, then starts

### Shutdown Order:
1. **Frontend** stops first
2. **Backend** stops
3. **PostgreSQL** stops last (preserves data)

## 📝 Summary

**Total Containers: 3**
- ✅ PostgreSQL (Database)
- ✅ Backend (API Server)
- ✅ Frontend (Web Application)

**External Services: 3**
- Auth0 (Authentication)
- Paymob (Payments)
- SendGrid (Email, optional)

All containers are orchestrated via `docker-compose.yml` and communicate through a Docker bridge network.


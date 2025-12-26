# Craftique E-Commerce Platform - AI Coding Instructions

## Architecture Overview
Craftique is a secure e-commerce platform using **Controller-Service-Repository (CSR) pattern**:
- **Backend**: Express/TypeScript REST API with PostgreSQL (Prisma ORM)
- **Frontend**: Next.js 16 with React 19, Radix UI, and Tailwind CSS
- **Auth**: Auth0 JWT tokens stored in HttpOnly cookies
- **Payments**: Paymob gateway with HMAC-SHA512 verification

## Backend Development (`/Backend`)

### Layer Responsibilities
```
Request → Routes → Middleware (auth/validation) → Controller → Service → Repository → Prisma
```
- **Controllers** (`src/controllers/`): HTTP handling only—extract data, call service, return response
- **Services** (`src/services/`): Business logic, Auth0/Paymob API calls, transaction management
- **Repositories** (`src/repositories/`): Pure Prisma queries, no business logic
- **Middleware** (`src/middleware/`): Auth (`verifyJWT`, `requireRole`), Zod validation

### Key Patterns
- **Validation**: All POST/PUT routes use Zod schemas with `.strict()` to prevent mass assignment (see `src/validators/schemas.ts`)
- **Error handling**: Use custom error classes from `src/utils/errors.ts` (`AppError`, `AuthenticationError`, `NotFoundError`, etc.)
- **Logging**: Use `logger` from `src/utils/logger.ts` with PII redaction
- **Auth middleware chain**: `verifyJWT` → `extractUser` → `requireRole('admin')` or `requireOwnership('user_id')`

### Adding New Endpoints
1. Define Zod schema in `src/validators/schemas.ts`
2. Add route in `src/routes/` with middleware: `router.post('/', verifyJWT, validateBody(schema), controller.method)`
3. Create controller method (thin—delegates to service)
4. Implement service logic
5. Add repository method if new DB operation needed

### Database Schema
- Uses PostgreSQL with Prisma (`prisma/schema.prisma`)
- Enums: `UserRole` (customer/moderator/admin), `OrderStatus`, `PaymentStatus`
- Run migrations: `npm run prisma:migrate`, generate client: `npm run prisma:generate`

## Frontend Development (`/Frontend`)

### API Integration
- Endpoints centralized in `lib/endpoints.ts` with SSR/CSR URL detection
- Services in `services/catalog.ts` and `services/checkout.ts` handle API calls
- Always use `credentials: 'include'` for cookie-based auth
- Types defined in `lib/types.ts`, validation in `lib/validation.ts`

### UI Components
- Uses shadcn/ui components in `components/ui/`
- Radix UI primitives for accessibility
- Theme via `next-themes` provider

## Common Commands

```bash
# Backend
cd Backend
npm run dev                  # Development with nodemon
npm run build               # TypeScript compile
npm test                    # Jest tests
npm run prisma:studio       # DB GUI

# Frontend
cd Frontend
pnpm dev                    # Next.js dev server
pnpm test                   # Jest + React Testing Library
pnpm build                  # Production build

# Docker (from root)
docker-compose up -d --build    # Start all services
docker-compose logs -f backend  # View backend logs
```

## Security Considerations
- JWT verification via Auth0 JWKS endpoint (RS256)
- Rate limiting: stricter on `/auth/*` routes
- Helmet.js for security headers
- CORS configured for frontend origin only
- Paymob webhooks verify HMAC-SHA512 signatures
- Passwords require: uppercase, lowercase, number, special char

## Testing Strategy
- Backend: Mock repositories and external APIs (Auth0, Paymob)
- Frontend: Mock fetch API and Next.js router
- Test files: `src/__tests__/` in both projects
- Middleware tests verify mass assignment prevention

## Environment Variables
Required vars in `Backend/src/config/env.ts`:
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`
- `DATABASE_URL` (PostgreSQL connection string)
- `PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET`
- `JWT_SECRET`, `COOKIE_SECRET`

Frontend: `NEXT_PUBLIC_API_BASE_URL` for browser API calls

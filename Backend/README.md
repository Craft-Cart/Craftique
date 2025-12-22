# Craftique Backend API

Production-ready REST API for Craftique e-commerce platform built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- ✅ **Controller-Service-Repository Pattern** - Clean separation of concerns
- ✅ **Auth0 Integration** - Stateless authentication with JWT in HttpOnly cookies
- ✅ **Zod Validation** - Strict input validation on all POST/PUT routes
- ✅ **Paymob Payment Integration** - Secure payment processing with HMAC verification
- ✅ **Security Hardened** - Following OWASP Top 10 best practices
- ✅ **Comprehensive Logging** - Winston with PII redaction
- ✅ **Type Safety** - Full TypeScript implementation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Auth0 account
- Paymob account

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH0_DOMAIN` - Your Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret
- `AUTH0_AUDIENCE` - Auth0 API identifier
- `PAYMOB_API_KEY` - Paymob API key
- `PAYMOB_HMAC_SECRET` - Paymob HMAC secret for webhook verification

## API Documentation

The API follows the OpenAPI specification defined in `../api.yaml`.

Base URL: `http://localhost:8000/api/v1`

### Authentication

All protected routes require a JWT token stored in an HttpOnly cookie. The token is automatically sent with requests when `credentials: 'include'` is set in fetch calls.

### Security Features

1. **HttpOnly Cookies** - JWT tokens stored in HttpOnly, Secure, SameSite=Strict cookies
2. **Zod Validation** - All inputs validated with strict schemas (prevents mass assignment)
3. **Rate Limiting** - Express rate limiting on all routes, stricter on auth endpoints
4. **HMAC Verification** - Paymob webhooks verified with HMAC-SHA512
5. **Error Handling** - Generic error messages in production, detailed in development
6. **PII Redaction** - Sensitive data automatically redacted from logs
7. **Helmet.js** - Security headers configured
8. **CORS** - Configured for frontend origin only

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── repositories/    # Data access layer
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utilities and helpers
├── validators/      # Zod validation schemas
└── server.ts        # Application entry point
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Testing

```bash
npm test
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Start the server:
```bash
npm start
```

## Security Considerations

- Never commit `.env` files
- Use strong secrets for JWT and HMAC
- Enable HTTPS in production
- Configure CORS properly for your frontend domain
- Regularly update dependencies
- Monitor logs for suspicious activity

## License

ISC


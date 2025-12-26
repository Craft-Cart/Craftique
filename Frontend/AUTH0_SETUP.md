# Auth0 Integration Setup

This Next.js app has been integrated with Auth0 for authentication. Follow these steps to complete the setup:

## 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new application → "Regular Web Application"
3. Configure:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`

## 2. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Auth0 credentials:

```bash
cp .env.local.example .env.local
```

Update the following variables:
- `AUTH0_SECRET`: Generate a random secret string
- `AUTH0_DOMAIN`: Your Auth0 domain (e.g., `your-tenant.auth0.com`)
- `AUTH0_CLIENT_ID`: Your application's Client ID
- `AUTH0_CLIENT_SECRET`: Your application's Client Secret
- `APP_BASE_URL`: Your application URL (http://localhost:3000 for development)

## 3. Generate Auth0 Secret

Generate a secure secret for the `AUTH0_SECRET` environment variable:

```bash
openssl rand -base64 32
```

## 4. Features Implemented

- **Authentication**: Login/logout functionality via Auth0
- **Protected Routes**: Profile page requires authentication
- **User Session**: Session management with automatic token refresh
- **User Profile**: Display user information from Auth0
- **TypeScript Support**: Type-safe user data handling
- **Middleware**: Route protection and session validation

## 5. API Endpoints

- `/api/auth/login` - Initiates Auth0 login
- `/api/auth/logout` - Clears Auth0 session
- `/api/me` - Returns current user profile (protected)

## 6. Protected Pages

- `/profile` - User profile page (requires authentication)

## 7. Usage in Components

```tsx
import { useUser } from '@auth0/nextjs-auth0/client';

export function MyComponent() {
  const { user, isLoading, error } = useUser();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

## 8. Server-Side Usage

```tsx
import { auth0 } from '@/lib/auth0';

export default auth0.withPageAuthRequired(async function MyPage() {
  const session = await auth0.getSession();
  return <div>Hello, {session.user.name}!</div>;
});
```

## 9. Development

Start the development server:

```bash
npm run dev
```

The authentication flow will work at http://localhost:3000

## 10. Production Deployment

For production deployment, update these environment variables:
- `APP_BASE_URL` to your production URL
- Add your production domain to Auth0 allowed URLs
- Ensure HTTPS is used (required for production)
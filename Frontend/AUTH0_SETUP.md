# Auth0 Configuration

This application uses Auth0 for authentication with the Next.js 16 SDK.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=$(openssl rand -hex 32)  # Generate a 32-byte hex secret
APP_BASE_URL=http://localhost:3000

# Optional - for custom APIs
AUTH0_AUDIENCE=https://your-api-identifier
```

### 2. Auth0 Application Setup

Create an Auth0 application with:

- **Type**: Regular Web Application
- **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`

**Important**: To enable refresh tokens and prevent "access token expired" errors:
1. Go to Auth0 Dashboard → Applications → Your Application
2. Navigate to "Advanced Settings" → "Grant Types"
3. Ensure "Refresh Token" is enabled
4. This allows the SDK to automatically refresh expired tokens

## Available Routes

### Auth0 SDK Routes (Automatic)

The SDK automatically provides these routes:

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page |
| `/auth/logout` | Logout |
| `/auth/callback` | OAuth callback (add to Auth0) |
| `/auth/profile` | Session profile |
| `/auth/access-token` | Access token |
| `/auth/backchannel-logout` | Backchannel logout |

### Custom API Routes

This app also has custom routes for backend integration:

| Route | Description | Purpose |
|-------|-------------|----------|
| `/api/auth/sync` | Sync Auth0 user with backend | Creates/updates user in database |
| `/api/auth/token` | Get access token | Alias for `/auth/access-token` (for legacy code) |
| `/api/me` | Get user profile | Alias for `/auth/profile` (for backend integration) |

**Note**: You can use either SDK routes or custom API routes. Custom routes provide additional backend sync functionality.

## Usage

### Server Components

```typescript
import { auth0 } from "@/lib/auth0";

export default async function Page() {
  const session = await auth0.getSession();

  if (!session) {
    return <a href="/auth/login">Log in</a>;
  }

  return <h1>Welcome, {session.user.name}!</h1>;
}
```

### Client Components

```typescript
"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export function UserProfile() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <a href="/auth/login">Log in</a>;

  return <h1>Welcome, {user.name}!</h1>;
}
```

### Middleware

Authentication is handled by `src/proxy.ts`. The SDK automatically:

- Protects routes when users are not authenticated
- Manages sessions
- Handles authentication flows

To protect routes, check for session in server components:

```typescript
import { auth0 } from "@/lib/auth0";

export default async function Profile() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Protected content
}
```

## Accessing User Data

### Server-Side

```typescript
const session = await auth0.getSession();
console.log(session.user.name);
console.log(session.user.email);
```

### Client-Side

```typescript
const { user } = useUser();
console.log(user.name);
console.log(user.email);
```

## Custom Claims

Add custom claims to user tokens in Auth0:

```typescript
const session = await auth0.getSession();
const role = session.user['https://your-namespace.com/role'];
```

## Token Expiration Handling

This app automatically handles expired access tokens:

1. **Automatic Refresh**: With refresh tokens enabled, the SDK refreshes expired tokens automatically
2. **Graceful Logout**: If tokens can't be refreshed, users are redirected to `/auth/logout`
3. **Client-Side Detection**: The auth service detects expired sessions and redirects to login

## Testing

For testing with demo mode, see `src/lib/demo-auth.ts`.

## Advanced Configuration

### Auto-Sync User on Login

You can automatically sync users to your backend after successful login using `beforeSessionSaved` hook:

```typescript
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  // ... other config
  beforeSessionSaved: async ({ session, req, res }) => {
    // Sync user to backend
    try {
      await fetch(`${process.env.API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to sync user:', error);
      // Don't block login if sync fails
    }
    return session;
  },
});
```

### Disable Access Token Endpoint

If you don't need client-side access tokens, disable the endpoint for better security:

```typescript
export const auth0 = new Auth0Client({
  // ... other config
  enableAccessTokenEndpoint: false,
});
```

### Custom Logout URL

Set custom logout redirect:

```typescript
export const auth0 = new Auth0Client({
  // ... other config
  routes: {
    logout: '/custom-logout',
  },
});
```

## Troubleshooting

### "Access token has expired" error

If you see this error, ensure:
1. Refresh tokens are enabled in Auth0 Dashboard
2. The `offline_access` scope is included in authorizationParameters
3. Your Auth0 application is configured as "Regular Web Application"

The SDK will automatically redirect users to `/auth/logout` when tokens expire and can't be refreshed.

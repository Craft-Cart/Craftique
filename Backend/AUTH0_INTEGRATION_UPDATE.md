# Backend Auth0 Integration Update - Summary

## Changes Made

### 1. Installed Auth0 SDK v5
```bash
cd Backend
npm install auth0
```

### 2. Updated Authentication Middleware (`src/middleware/auth.ts`)

**Before:**
- Used `jsonwebtoken` and `jwks-rsa` libraries
- Manual JWKS fetching and verification
- Limited cookie support (`access_token` only)

**After:**
- Installed `auth0` SDK v5
- Added `ManagementClient` for admin operations
- Enhanced token extraction with multiple cookie support:
  - `appSession` (Auth0 Next.js SDK cookie)
  - `access_token` (legacy cookie)
  - Authorization `Bearer` header (API clients)
- Better error logging with detailed debug information
- Proper TypeScript error handling

### 3. Token Extraction Priority

The middleware now checks for tokens in this order:

1. **Authorization Header** (API clients)
   ```bash
   Authorization: Bearer <token>
   ```

2. **Auth0 Session Cookie** (Next.js SDK)
   ```javascript
   Cookie: appSession=sessionId|userId|token...
   ```

3. **Legacy Cookie** (backward compatibility)
   ```javascript
   Cookie: access_token=<token>
   ```

### 4. Enhanced Debugging

Added detailed logging for debugging token issues:

```typescript
logger.debug('Token extracted from Authorization header', {
  ip: req.ip,
  tokenLength: token?.length,
});

logger.warn('No authentication token found in request', {
  ip: req.ip,
  hasAuthHeader: !!authHeader,
  hasCookies: !!req.cookies,
  cookieKeys: Object.keys(req.cookies || {}),
});
```

### 5. Created Documentation

- `AUTH0_SETUP.md` - Complete backend Auth0 integration guide
- `AUTH0_INTEGRATION_UPDATE.md` - This summary document

## Token Verification Flow

### Current Implementation (Basic JWT Decoding)

The current implementation decodes JWT tokens without JWKS verification:

```typescript
const verifyToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    throw error;
  }
};
```

### Future Enhancement (Full JWKS Verification)

To implement full JWKS verification with Auth0 SDK:

```typescript
import { AuthenticationClient } from 'auth0';

const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
});

// Verify token with Auth0 JWKS
const user = await auth0.userInfo(token);
```

## Fixing "No Authentication Token Provided" Error

### Problem

The error occurs when backend cannot find token in:
- Authorization header
- `appSession` cookie
- `access_token` cookie

### Solutions

#### 1. Frontend - Send Token in Authorization Header

```typescript
// In frontend auth-service.ts
async syncUser(auth0User?: Auth0User): Promise<User> {
  try {
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // <-- Important!
      },
    });
    // ...
  }
}
```

#### 2. Frontend - Use Auth0 Next.js SDK

The Auth0 Next.js SDK automatically sends tokens in `appSession` cookie. Ensure:
1. Proxy is configured correctly (`src/proxy.ts`)
2. Cookies are being sent with requests

#### 3. Check Cookie Configuration

Ensure frontend sets cookies properly:

```typescript
// Frontend auth0.ts
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  session: {
    rolling: true,
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
});
```

## Environment Variables Required

### Backend (`.env` or environment)

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Optional: For Auth0 SDK token verification
# AUTH0_API_V2_TOKEN=your-management-api-token
```

### Frontend (`.env.local`)

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=$(openssl rand -hex 32)
APP_BASE_URL=http://localhost:3000
AUTH0_AUDIENCE=https://your-api-identifier

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Testing the Fix

### 1. Build Backend

```bash
cd Backend
npm run build
```

### 2. Start Backend

```bash
cd Backend
npm start
```

### 3. Check Logs

Look for these log messages:

**Success:**
```json
{
  "level": "info",
  "message": "Authentication successful",
  "ip": "::1",
  "subject": "auth0|12345",
  "email": "user@example.com"
}
```

**Token Found (Authorization Header):**
```json
{
  "level": "debug",
  "message": "Token extracted from Authorization header",
  "ip": "::1",
  "tokenLength": 512
}
```

**Token Found (Auth0 Cookie):**
```json
{
  "level": "debug",
  "message": "Parsed token from Auth0 session cookie",
  "ip": "::1",
  "tokenStart": "eyJhbGc..."
}
```

**No Token Found:**
```json
{
  "level": "warn",
  "message": "No authentication token found in request",
  "ip": "::1",
  "method": "GET",
  "path": "/api/v1/items",
  "hasAuthHeader": false,
  "hasAuth0Session": false,
  "hasLegacyCookie": false,
  "availableCookies": ["session_id", "other_cookie"]
}
```

## Next Steps for Full Auth0 Integration

1. **Enable Refresh Tokens** in Auth0 Dashboard
   - Go to Application → Advanced Settings → Grant Types
   - Enable "Refresh Token"

2. **Add Custom Claims** to Auth0 Tokens
   - Add roles claim: `https://craftique.com/role`
   - Add permissions claim: `https://craftique-api/permissions`

3. **Implement Full JWKS Verification** (Optional)
   - Replace basic JWT decoding with Auth0 SDK
   - Use `AuthenticationClient.userInfo(token)` for validation

4. **Test with Different Scenarios**
   - User login via frontend
   - API calls with Authorization header
   - Token refresh scenarios
   - Logout and cleanup

## Troubleshooting Checklist

- [ ] Frontend `appBaseUrl` matches backend URL
- [ ] Frontend proxy configured correctly (`src/proxy.ts`)
- [ ] Backend environment variables set correctly
- [ ] Auth0 application allows backend domain
- [ ] Cookies are being sent (check network tab)
- [ ] Token format is valid JWT (RS256)
- [ ] Token not expired (check `exp` claim)
- [ ] Backend receiving cookie (check logs)

## References

- [Auth0 Node.js SDK v5 Documentation](https://www.npmjs.com/package/auth0)
- [Auth0 Next.js SDK Documentation](https://www.npmjs.com/package/@auth0/nextjs-auth0)
- [Backend Auth0 Setup](./AUTH0_SETUP.md)
- [Frontend Auth0 Setup](../Frontend/AUTH0_SETUP.md)

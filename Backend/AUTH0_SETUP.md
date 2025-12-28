# Backend Auth0 Integration

This backend uses Auth0 for authentication and authorization with the Auth0 Node.js SDK v5.

## Setup

### 1. Environment Variables

Ensure these environment variables are set in the backend:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER=https://your-tenant.auth0.com/
```

### 2. Token Verification

The backend accepts tokens from multiple sources:

1. **Authorization Header** (Recommended for API clients):
   ```bash
   Authorization: Bearer <token>
   ```

2. **Auth0 Session Cookie** (From Next.js SDK):
   - Cookie name: `appSession`
   - Format: `sessionId|userId|token|...`

3. **Legacy Cookie** (Backward compatibility):
   - Cookie name: `access_token`

### 3. Token Format

Tokens are JWTs with Auth0 RS256 signature. The middleware extracts:

- `sub` - User subject (Auth0 user ID)
- `email` - User email
- `role` - User role from custom claims
- `permissions` - User permissions from custom claims

### 4. Custom Claims

Add these custom claims to your Auth0 tokens:

**Roles:**
```json
{
  "https://craftique.com/role": "admin"
}
```

**Permissions:**
```json
{
  "https://craftique-api/permissions": ["read:items", "create:orders"]
}
```

## Middleware

### verifyJWT

Verifies JWT token and extracts user information:

```typescript
import { verifyJWT } from './middleware/auth';

app.get('/api/v1/protected', verifyJWT, (req, res) => {
  console.log(req.user); // { id, auth0_id, email, role, permissions }
  res.json({ message: 'Protected route' });
});
```

### requireRole

Requires specific role(s):

```typescript
import { requireRole } from './middleware/auth';

app.get('/api/v1/admin', verifyJWT, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only' });
});
```

### requirePermission

Requires specific permission(s):

```typescript
import { requirePermission } from './middleware/auth';

app.post('/api/v1/items', verifyJWT, requirePermission('create:items'), (req, res) => {
  res.json({ message: 'Create items' });
});
```

### requireOwnership

Checks if user owns the resource:

```typescript
import { requireOwnership } from './middleware/auth';

app.delete('/api/v1/orders/:order_id', verifyJWT, requireOwnership('order_id'), (req, res) => {
  // Users can only delete their own orders
  res.json({ message: 'Order deleted' });
});
```

### requireRoleForAction

RBAC matrix for role-based access control:

```typescript
import { requireRoleForAction } from './middleware/auth';

app.delete('/api/v1/categories/:id', verifyJWT, requireRoleForAction('delete', 'categories'), (req, res) => {
  // Only admins can delete categories
  res.json({ message: 'Category deleted' });
});
```

## Role-Based Access Control

The backend uses the following roles:

| Role | Permissions |
|-------|-------------|
| `customer` | Read products, create orders, manage own reviews |
| `moderator` | Read all orders, moderate reviews, create/update items |
| `admin` | Full access to all resources |

## Troubleshooting

### "No authentication token provided"

**Cause:** Token not found in Authorization header or cookies.

**Solutions:**
1. Check that frontend sends token in Authorization header:
   ```javascript
   fetch('http://localhost:8000/api/v1/protected', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```
2. Check Auth0 Next.js SDK cookie is being sent
3. Check cookie configuration in frontend

### "Token has expired"

**Cause:** JWT token has passed its expiration time.

**Solution:** The Auth0 Next.js SDK automatically refreshes expired tokens. Ensure:
1. Refresh tokens are enabled in Auth0 Dashboard
2. The `offline_access` scope is included in frontend config

### "Invalid token"

**Cause:** Token format is invalid or signature verification failed.

**Solution:** Ensure the token comes from a valid Auth0 session.

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | User logout |
| `/api/v1/auth/verify` | GET | Verify token and get user info |

### Protected Endpoints

All endpoints starting with `/api/v1/` (except auth routes) require authentication via `verifyJWT` middleware.

## Security Best Practices

1. **Always use HTTPS** in production
2. **Never expose tokens** in client-side code
3. **Use HttpOnly cookies** for token storage
4. **Set appropriate cookie SameSite** policy (strict/lax)
5. **Implement rate limiting** to prevent brute force attacks
6. **Validate all inputs** even for authenticated users
7. **Use RBAC** to enforce least-privilege access
8. **Audit sensitive actions** in logs

## Development

For testing without Auth0, use the demo mode:

```typescript
// In services/auth.service.ts
if (process.env.NODE_ENV === 'demo') {
  // Allow demo user access
}
```

## Next Steps

For full JWKS verification with Auth0 SDK:

```typescript
import { AuthenticationClient } from 'auth0';

const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
});

// Verify token with Auth0 JWKS
const user = await auth0.userInfo(token);
```

This is currently using basic JWT validation for debugging. Replace with Auth0 SDK verification when ready.

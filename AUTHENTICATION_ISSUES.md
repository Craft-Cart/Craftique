# Authentication Flow Issues

This document identifies critical issues and potential problems in the current authentication implementation.

## 🔴 Critical Issues

### 1. **Token Access Failure in Frontend**
**Location**: `Frontend/lib/auth-service.ts` (lines 84-103)

**Problem**: 
The `getAuthToken()` method tries to access tokens from `localStorage` or cookies, but Next.js Auth0 SDK v4 stores tokens in **encrypted HttpOnly cookies** that are **NOT accessible via JavaScript**.

```typescript
private async getAuthToken(): Promise<string> {
  // This will ALWAYS fail because:
  // 1. localStorage won't have the token (Auth0 SDK doesn't use it)
  // 2. HttpOnly cookies cannot be read by JavaScript
  const auth0Token = localStorage.getItem('auth0_access_token')
  // ...
}
```

**Impact**: 
- `syncUser()` will always throw "No authentication token available"
- `getCurrentUser()` will always fail
- Frontend cannot communicate with backend API using Auth0 tokens

**Solution**: 
Use Next.js Auth0 SDK's `getAccessToken()` method on the server-side, or create a Next.js API route that proxies the token.

---

### 2. **No User Sync Between Frontend and Backend**
**Location**: `Frontend/hooks/use-rbac.ts` (line 35)

**Problem**: 
When users log in via the frontend Auth0 SDK, they are **never synced with the backend database**. The code even has a comment acknowledging this:

```typescript
// Create a mock user object based on Auth0 user data
// In a real implementation, you would sync this with backend
```

**Impact**: 
- Users logged in via frontend don't exist in backend database
- Backend API calls will fail (user not found)
- Orders, reviews, wishlist won't work for frontend-authenticated users
- Data inconsistency between frontend and backend

**Solution**: 
Call `authService.syncUser()` after successful Auth0 login, or create a Next.js API route that handles the sync server-side.

---

### 3. **Two Separate Authentication Systems**
**Problem**: 
The frontend and backend use **completely different authentication approaches**:

- **Frontend**: Next.js Auth0 SDK (OAuth Authorization Code flow)
- **Backend**: Direct Auth0 API calls (Password Grant + Management API)

**Impact**: 
- Users authenticated via frontend **cannot use backend APIs** that require authentication
- Backend login/register endpoints are **not used by the frontend**
- Confusion about which authentication method to use
- Potential security vulnerabilities from inconsistent auth flows

**Solution**: 
Choose one approach:
- **Option A**: Use frontend Auth0 SDK for everything, create Next.js API routes that proxy to backend
- **Option B**: Use backend endpoints for everything, frontend calls backend `/auth/login` and `/auth/register`

---

### 4. **Password Grant is Deprecated**
**Location**: `Backend/src/services/auth.service.ts` (line 23)

**Problem**: 
Auth0's **Password Grant** (`grant_type: 'password'`) is **deprecated** and not recommended for production use.

```typescript
grant_type: 'password',  // ⚠️ DEPRECATED
```

**Impact**: 
- Security concerns (passwords sent directly to backend)
- May stop working in future Auth0 updates
- Not recommended by Auth0 for web applications

**Solution**: 
Use OAuth Authorization Code flow instead. For backend-to-backend authentication, use Client Credentials grant.

---

## 🟡 Performance Issues

### 5. **Management Token Not Cached**
**Location**: `Backend/src/services/auth.service.ts` (lines 341-354)

**Problem**: 
The `getAuth0ManagementToken()` method gets a new token **every time** it's called, with only a comment saying "This should be cached in production".

```typescript
private async getAuth0ManagementToken(): Promise<string> {
  // This should be cached in production  // ⚠️ But it's not!
  const response = await axios.post(...)
  return response.data.access_token;
}
```

**Impact**: 
- Unnecessary API calls to Auth0 on every user registration
- Slower signup process
- Potential rate limiting issues

**Solution**: 
Implement token caching with expiration checking (management tokens typically expire in 24 hours).

---

## 🟠 Architecture Issues

### 6. **Token Audience/Scope Mismatch**
**Problem**: 
Frontend Auth0 SDK and backend may use different **audiences** or **scopes**, causing token verification to fail.

**Frontend**: Uses default Auth0 audience (likely the Auth0 API identifier)
**Backend**: Uses `config.auth0.audience` (may be different)

**Impact**: 
- Backend token verification may reject frontend tokens
- Users authenticated via frontend cannot access backend APIs

**Solution**: 
Ensure both frontend and backend use the same Auth0 API audience and scopes.

---

### 7. **Mock User Data Instead of Backend Sync**
**Location**: `Frontend/hooks/use-rbac.ts` (lines 34-46)

**Problem**: 
The `useRBAC` hook creates **mock user objects** from Auth0 data instead of fetching real user data from the backend database.

```typescript
// Create a mock user object based on Auth0 user data
// In a real implementation, you would sync this with backend
const user: User = {
  id: auth0User.sub || '',
  // ... mock data
}
```

**Impact**: 
- User data may be inconsistent (Auth0 vs Database)
- Database fields (like `created_at`, `updated_at`) are fake
- Backend user records may not exist
- Role/permission changes in database won't reflect in frontend

**Solution**: 
Fetch user data from backend API after Auth0 authentication, or ensure proper sync mechanism.

---

### 8. **Missing User Sync Trigger**
**Problem**: 
The `syncUser()` method exists in `auth-service.ts` but is **never called** anywhere in the codebase.

**Impact**: 
- Frontend-authenticated users never get synced to backend
- Backend operations will fail for these users

**Solution**: 
Call `syncUser()` after successful Auth0 login, either:
- In a `useEffect` hook when user becomes available
- In a Next.js API route that handles the Auth0 callback
- In middleware after session is established

---

## 🔵 Security Concerns

### 9. **Token Storage in localStorage (Potential)**
**Location**: `Frontend/lib/auth-service.ts` (line 89)

**Problem**: 
Code attempts to read from `localStorage`, which is **not secure** for storing tokens (vulnerable to XSS attacks).

**Impact**: 
- If tokens were stored in localStorage, they'd be vulnerable to XSS
- Fortunately, Auth0 SDK doesn't use localStorage, so this is currently not an issue, but the code suggests it might be intended

**Solution**: 
Remove localStorage token access. Use HttpOnly cookies only (which Auth0 SDK already does).

---

### 10. **CORS and Cookie Issues**
**Problem**: 
If frontend and backend are on different domains, HttpOnly cookies set by backend won't be accessible to frontend.

**Impact**: 
- Backend-set cookies won't work for cross-origin requests
- Frontend cannot use backend authentication cookies

**Solution**: 
- Ensure proper CORS configuration
- Use same domain or subdomain for frontend and backend
- Or use Authorization header instead of cookies for cross-origin

---

## 📋 Summary of Required Fixes

### High Priority (Must Fix)
1. ✅ Fix token access in `getAuthToken()` - use Next.js Auth0 SDK's server-side methods
2. ✅ Implement user sync after frontend Auth0 login
3. ✅ Unify authentication approach (choose frontend SDK or backend endpoints)
4. ✅ Replace deprecated password grant with OAuth flow

### Medium Priority (Should Fix)
5. ✅ Cache Auth0 Management API token
6. ✅ Ensure audience/scope consistency
7. ✅ Replace mock user data with real backend data

### Low Priority (Nice to Have)
8. ✅ Remove localStorage token access code
9. ✅ Add proper error handling for auth failures
10. ✅ Add logging for authentication flows

---

## 🔧 Recommended Architecture

### Option 1: Frontend-First (Recommended)
- Use Next.js Auth0 SDK for all frontend authentication
- Create Next.js API routes (`/api/auth/*`) that:
  - Get token from Auth0 session
  - Proxy requests to backend with token
  - Handle user sync automatically
- Backend only verifies tokens, doesn't handle login/register directly

### Option 2: Backend-First
- Frontend calls backend `/auth/login` and `/auth/register` endpoints
- Backend handles all Auth0 interactions
- Frontend stores tokens from backend response
- Simpler but less secure (tokens in frontend)

### Option 3: Hybrid (Current - Needs Fixes)
- Frontend uses Auth0 SDK for user-facing auth
- Backend has its own endpoints for API clients
- **Requires**: Proper token passing and user sync between systems

---

## 🎯 Quick Wins

1. **Add user sync in `use-rbac.ts`**:
```typescript
useEffect(() => {
  if (auth0User && !currentUser) {
    // Sync with backend
    authService.syncUser(auth0User).catch(console.error)
  }
}, [auth0User])
```

2. **Create Next.js API route for token access**:
```typescript
// app/api/auth/token/route.ts
export async function GET() {
  const session = await auth0.getSession()
  const token = await auth0.getAccessToken()
  return Response.json({ token })
}
```

3. **Cache management token**:
```typescript
private managementTokenCache: { token: string; expiresAt: number } | null = null

private async getAuth0ManagementToken(): Promise<string> {
  if (this.managementTokenCache && Date.now() < this.managementTokenCache.expiresAt) {
    return this.managementTokenCache.token
  }
  // ... fetch new token and cache it
}
```


# Authentication Flow Documentation

This document explains the complete authentication flow for both **Login** and **Signup** processes in the Craftique shopping project, covering both Frontend (Next.js) and Backend (Express) implementations.

## Architecture Overview

The project uses **Auth0** for authentication with two different approaches:

1. **Frontend**: Uses Next.js Auth0 SDK v4 (`@auth0/nextjs-auth0`) for OAuth-based authentication
2. **Backend**: Uses Auth0 Management API and OAuth Token endpoint for direct authentication

---

## 🔐 LOGIN FLOW

### Frontend Login Flow (Next.js + Auth0 SDK)

#### Step 1: User Initiates Login
- **Location**: User clicks login button (e.g., in `SiteHeader` component)
- **Action**: User navigates to `/api/auth/login` or clicks a link to `/auth/login`
- **Code Reference**: `Frontend/components/site-header.tsx` (lines 96-99)

#### Step 2: Next.js Middleware Intercepts
- **Location**: `Frontend/middleware.ts`
- **Process**:
  1. Middleware checks if route requires authentication
  2. If protected route (e.g., `/profile`, `/admin`) and no session exists:
     - Redirects to `/api/auth/login?returnTo=<original-url>`
  3. Auth0 middleware (`auth0.middleware()`) handles the request
- **Code Reference**: `Frontend/middleware.ts` (lines 5-51)

#### Step 3: Auth0 SDK Handles OAuth Flow
- **Location**: Next.js Auth0 SDK automatically creates routes at `/api/auth/*`
- **Process**:
  1. SDK redirects user to Auth0 Universal Login page
  2. User enters credentials on Auth0's hosted page
  3. Auth0 validates credentials
  4. Auth0 redirects back to `/api/auth/callback` with authorization code
  5. SDK exchanges code for tokens (access_token, id_token, refresh_token)
  6. SDK stores session in encrypted cookies
- **Configuration**: `Frontend/lib/auth0.ts` (lines 1-12)

#### Step 4: Session Established
- **Location**: Auth0 SDK session management
- **Process**:
  1. Session stored in encrypted HttpOnly cookies
  2. User object available via `useUser()` hook
  3. User redirected to original destination or home page
- **Code Reference**: `Frontend/hooks/use-rbac.ts` (lines 7-58)

#### Step 5: User Sync with Backend (Optional)
- **Location**: `Frontend/lib/auth-service.ts`
- **Process**:
  1. Frontend can call `authService.syncUser(auth0User)` to sync with backend
  2. Makes GET request to `/api/v1/auth/verify` with Auth0 token
  3. Backend verifies token and returns user data
- **Code Reference**: `Frontend/lib/auth-service.ts` (lines 17-44)

---

### Backend Login Flow (Express + Auth0 API)

#### Step 1: Client Sends Credentials
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "userpassword"
  }
  ```
- **Code Reference**: `Backend/src/routes/auth.routes.ts` (line 15)

#### Step 2: Auth Controller Receives Request
- **Location**: `Backend/src/controllers/auth.controller.ts`
- **Process**:
  1. Validates request body using `loginSchema`
  2. Calls `authService.login(email, password)`
- **Code Reference**: `Backend/src/controllers/auth.controller.ts` (lines 12-30)

#### Step 3: Auth Service Authenticates with Auth0
- **Location**: `Backend/src/services/auth.service.ts`
- **Process**:
  1. **Authenticate with Auth0** (lines 17-33):
     - POST to `https://{AUTH0_DOMAIN}/oauth/token`
     - Uses `grant_type: 'password'` (Resource Owner Password Grant)
     - Sends: `client_id`, `client_secret`, `audience`, `username`, `password`, `scope`
     - Receives: `access_token`, `refresh_token`, `expires_in`

  2. **Get User Info from Auth0** (lines 38-45):
     - GET to `https://{AUTH0_DOMAIN}/userinfo`
     - Uses `access_token` in Authorization header
     - Receives: `sub` (Auth0 user ID), `email`, `name`, `email_verified`, etc.

  3. **Find or Create User in Database** (lines 48-63):
     - Searches database by `auth0_id` (from `userInfo.sub`)
     - If user exists: Updates `last_login` timestamp
     - If user doesn't exist: Creates new user record with:
       - `auth0_id`: From Auth0 `sub`
       - `email`: From Auth0 user info
       - `name`: From Auth0 user info or email prefix
       - `role`: From Auth0 metadata or defaults to 'customer'
       - `permissions`: From Auth0 metadata or empty array

  4. **Return Tokens and User** (lines 65-71):
     - Returns `access_token`, `refresh_token`, `token_type`, `expires_in`, `user`
- **Code Reference**: `Backend/src/services/auth.service.ts` (lines 14-81)

#### Step 4: Controller Sets Cookies and Responds
- **Location**: `Backend/src/controllers/auth.controller.ts`
- **Process**:
  1. Sets HttpOnly cookies for `access_token` and `refresh_token`
  2. Returns JSON response with tokens and user data
- **Code Reference**: `Backend/src/controllers/auth.controller.ts` (lines 17-26)

#### Step 5: Token Verification (For Protected Routes)
- **Location**: `Backend/src/middleware/auth.ts`
- **Process**:
  1. Middleware `verifyJWT` extracts token from:
     - HttpOnly cookie (`access_token`)
     - Or Authorization header (`Bearer <token>`)
  
  2. **Verifies Token with Auth0** (lines 42-61):
     - Uses JWKS (JSON Web Key Set) from Auth0
     - Fetches public key from `https://{AUTH0_DOMAIN}/.well-known/jwks.json`
     - Verifies JWT signature, audience, issuer, expiration
     - Extracts user claims (role, permissions, email, etc.)
  
  3. **Attaches User to Request** (lines 101-107):
     - Sets `req.user` with: `id`, `auth0_id`, `email`, `role`, `permissions`
- **Code Reference**: `Backend/src/middleware/auth.ts` (lines 64-124)

---

## 📝 SIGNUP FLOW

### Frontend Signup Flow (Next.js + Auth0 SDK)

#### Step 1: User Initiates Signup
- **Location**: User navigates to signup page or form
- **Action**: User fills out registration form (email, password, name, etc.)

#### Step 2: Two Possible Approaches:

**Option A: Direct Backend Signup (Recommended)**
- Frontend sends POST request to backend `/api/v1/auth/register`
- Backend handles Auth0 user creation
- See "Backend Signup Flow" below

**Option B: Auth0 Universal Signup**
- User is redirected to Auth0 Universal Login
- Auth0 handles signup form
- After signup, Auth0 redirects to callback
- Same flow as login after authentication

---

### Backend Signup Flow (Express + Auth0 Management API)

#### Step 1: Client Sends Registration Data
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "securepassword",
    "name": "John Doe",
    "phone": "+1234567890"  // optional
  }
  ```
- **Code Reference**: `Backend/src/routes/auth.routes.ts` (line 16)

#### Step 2: Auth Controller Receives Request
- **Location**: `Backend/src/controllers/auth.controller.ts`
- **Process**:
  1. Validates request body using `registerSchema`
  2. Calls `authService.register(email, password, name, phone)`
- **Code Reference**: `Backend/src/controllers/auth.controller.ts` (lines 32-50)

#### Step 3: Auth Service Checks for Existing User
- **Location**: `Backend/src/services/auth.service.ts`
- **Process**:
  1. **Check Database** (lines 86-89):
     - Queries database by email
     - If user exists, throws `ConflictError`
  
  2. **Get Auth0 Management Token** (line 104):
     - POST to `https://{AUTH0_DOMAIN}/oauth/token`
     - Uses `grant_type: 'client_credentials'`
     - Audience: `https://{AUTH0_DOMAIN}/api/v2/`
     - Receives management API access token
     - **Code Reference**: `Backend/src/services/auth.service.ts` (lines 341-354)

  3. **Create User in Auth0** (lines 92-108):
     - POST to `https://{AUTH0_DOMAIN}/api/v2/users`
     - Uses management token in Authorization header
     - Sends: `email`, `password`, `name`, `phone_number`, `connection`, `email_verified: false`
     - Connection: `'Username-Password-Authentication'`
     - Receives: `user_id` (Auth0 user ID)

  4. **Create User in Database** (lines 113-121):
     - Creates user record with:
       - `auth0_id`: From Auth0 `user_id`
       - `email`: From request
       - `email_verified`: `false` (user must verify email)
       - `name`: From request
       - `phone`: From request (optional)
       - `role`: Defaults to `'customer'`
       - `permissions`: Empty array

  5. **Auto-Login User** (line 124):
     - Calls `this.login(email, password)` to authenticate user immediately
     - Returns tokens and user data (same as login flow)
- **Code Reference**: `Backend/src/services/auth.service.ts` (lines 83-134)

#### Step 4: Controller Sets Cookies and Responds
- **Location**: `Backend/src/controllers/auth.controller.ts`
- **Process**:
  1. Sets HttpOnly cookies for `access_token` and `refresh_token`
  2. Returns 201 status with tokens and user data
- **Code Reference**: `Backend/src/controllers/auth.controller.ts` (lines 37-46)

---

## 🔄 Token Refresh Flow

### When Access Token Expires

#### Frontend (Next.js Auth0 SDK)
- SDK automatically handles token refresh
- Uses refresh token stored in session
- Transparent to application code

#### Backend
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Process**:
  1. Client sends `refresh_token` (from cookie or body)
  2. Backend exchanges refresh token with Auth0 for new access token
  3. New access token set in cookie
  4. Returns new `access_token` and `expires_in`
- **Code Reference**: 
  - `Backend/src/routes/auth.routes.ts` (line 17)
  - `Backend/src/controllers/auth.controller.ts` (lines 52-69)
  - `Backend/src/services/auth.service.ts` (lines 136-157)

---

## 🔒 Token Verification Flow

### Backend Token Verification

#### Endpoint: `GET /api/v1/auth/verify`
- **Purpose**: Verify Auth0 token and get user data
- **Process**:
  1. Extracts token from cookie or Authorization header
  2. Verifies JWT with Auth0 JWKS
  3. Looks up user in database by `auth0_id`
  4. Returns user data
- **Code Reference**:
  - `Backend/src/routes/auth.routes.ts` (line 20)
  - `Backend/src/controllers/auth.controller.ts` (lines 80-93)
  - `Backend/src/services/auth.service.ts` (lines 178-224)

---

## 🛡️ Protected Route Flow

### Frontend Protection

#### Middleware-Based Protection
- **Location**: `Frontend/middleware.ts`
- **Process**:
  1. Middleware runs on every request
  2. Checks if route requires authentication
  3. Gets session using `auth0.getSession(request)`
  4. If no session and route is protected:
     - Redirects to `/api/auth/login?returnTo=<original-url>`
  5. If session exists, checks role for admin routes
- **Code Reference**: `Frontend/middleware.ts` (lines 19-48)

#### Component-Based Protection
- Uses `useUser()` hook from Auth0 SDK
- Components can check `user`, `isLoading`, `error`
- Example: `Frontend/components/site-header.tsx` (lines 85-114)

### Backend Protection

#### JWT Middleware
- **Location**: `Backend/src/middleware/auth.ts`
- **Middleware**: `verifyJWT`
- **Process**:
  1. Extracts token from cookie or Authorization header
  2. Verifies token with Auth0 JWKS
  3. Extracts user claims (role, permissions)
  4. Attaches `req.user` to request
  5. If verification fails, throws `AuthenticationError`

#### Role-Based Protection
- **Middleware**: `requireRole(...roles)`
- **Usage**: Applied to routes that need specific roles
- **Example**: Admin routes require `['admin']` or `['moderator']`
- **Code Reference**: `Backend/src/middleware/auth.ts` (lines 127-139)

---

## 📊 Flow Diagrams Summary

### Frontend Login (OAuth Flow)
```
User → /api/auth/login → Auth0 Universal Login → 
User enters credentials → Auth0 validates → 
/auth/callback → SDK exchanges code → 
Session stored → User authenticated
```

### Backend Login (Password Grant)
```
Client → POST /api/v1/auth/login → 
Backend → Auth0 /oauth/token (password grant) → 
Auth0 validates → Returns tokens → 
Backend → Auth0 /userinfo → 
Backend → Database (find/create user) → 
Backend → Set cookies → Return tokens + user
```

### Backend Signup
```
Client → POST /api/v1/auth/register → 
Backend → Check database (email exists?) → 
Backend → Get Auth0 Management Token → 
Backend → Auth0 Management API (create user) → 
Backend → Database (create user record) → 
Backend → Auto-login (same as login flow) → 
Return tokens + user
```

---

## 🔑 Key Files Reference

### Frontend
- **Auth0 Configuration**: `Frontend/lib/auth0.ts`
- **Middleware**: `Frontend/middleware.ts`
- **Auth Service**: `Frontend/lib/auth-service.ts`
- **RBAC Hook**: `Frontend/hooks/use-rbac.ts`
- **Auth Redirect**: `Frontend/components/auth-redirect.tsx`

### Backend
- **Auth Service**: `Backend/src/services/auth.service.ts`
- **Auth Controller**: `Backend/src/controllers/auth.controller.ts`
- **Auth Routes**: `Backend/src/routes/auth.routes.ts`
- **Auth Middleware**: `Backend/src/middleware/auth.ts`
- **Config**: `Backend/src/config/env.ts`

---

## 🔐 Security Features

1. **HttpOnly Cookies**: Tokens stored in HttpOnly cookies (not accessible via JavaScript)
2. **JWT Verification**: All tokens verified with Auth0's public keys (JWKS)
3. **Token Expiration**: Access tokens expire, refresh tokens used for renewal
4. **CSRF Protection**: Auth0 SDK handles CSRF protection
5. **Role-Based Access Control**: Roles and permissions enforced at middleware level
6. **Secure Password Storage**: Passwords stored in Auth0 (not in application database)

---

## 📝 Notes

- **Two Authentication Approaches**: The frontend uses OAuth flow (better UX), while backend can use password grant (for API clients)
- **User Sync**: Frontend can optionally sync Auth0 user with backend database
- **Email Verification**: New users have `email_verified: false` and should verify email
- **Management API**: Backend uses Auth0 Management API for user creation (requires special token)
- **Session Storage**: Frontend uses encrypted cookies, backend uses HttpOnly cookies


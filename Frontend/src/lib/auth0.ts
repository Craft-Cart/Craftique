import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  secret: process.env.AUTH0_SECRET || '',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  authorizationParameters: {
    // Include offline_access to get refresh tokens
    scope: 'openid profile email offline_access',
    // Ensure same audience as backend for token compatibility
    // Note: If audience is empty, Auth0 will use default audience
    ...(process.env.AUTH0_AUDIENCE || process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
      ? { audience: process.env.AUTH0_AUDIENCE || process.env.NEXT_PUBLIC_AUTH0_AUDIENCE }
      : {}),
  },
  session: {
    rolling: true,
    absoluteDuration: 60 * 60 * 24 * 7,
  },
});

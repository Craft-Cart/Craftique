import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Auth0
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    issuer: process.env.AUTH0_ISSUER || process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/` : '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Cookies
  cookie: {
    secret: process.env.COOKIE_SECRET || '',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.COOKIE_SAME_SITE || 'strict') as 'strict' | 'lax' | 'none',
  },

  // Paymob
  paymob: {
    apiKey: process.env.PAYMOB_API_KEY || '',
    integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID || '0', 10),
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
    callbackUrl: process.env.PAYMOB_CALLBACK_URL || 'http://localhost:8000/api/v1/payments/paymob/callback',
  },

  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourstore.com',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate required environment variables
const requiredVars = [
  'DATABASE_URL',
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_AUDIENCE',
  'JWT_SECRET',
  'COOKIE_SECRET',
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
];

if (config.nodeEnv === 'production') {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}


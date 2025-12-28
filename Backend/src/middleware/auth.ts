import { Request, Response, NextFunction } from 'express';
import { ManagementClient } from 'auth0';
import { config } from '../config/env';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
        user?: {
          id: string;
          auth0_id: string;
          email: string;
          role: string;
          permissions: string[];
        };
    }
  }
}

// Management client for Auth0 (for admin operations)
const managementClient = new ManagementClient({
  domain: config.auth0.domain,
  clientId: config.auth0.clientId,
  clientSecret: config.auth0.clientSecret,
});

// Auth0 Next.js SDK cookie names (from SDK documentation)
const AUTH0_SESSION_COOKIE = 'appSession';

// Extract token from request (supports both Auth0 SDK and custom implementations)
const extractToken = (req: Request): string | null => {
  // Priority 1: Check Authorization header (standard for API calls)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Log the full header for debugging
    logger.debug('Authorization header found', {
      ip: req.ip,
      headerLength: authHeader.length,
      headerFull: authHeader,
    });

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Check if token is actually present (not empty)
      if (token.length > 10) {
        logger.debug('Token extracted from Authorization header', {
          ip: req.ip,
          tokenLength: token?.length,
          tokenStart: token?.substring(0, 20),
        });
        return token;
      }
      logger.warn('Authorization header has Bearer prefix but no token', {
        ip: req.ip,
        headerLength: authHeader.length,
      });
      return null;
    }

    // Try to extract token without Bearer prefix (fallback)
    const trimmedHeader = authHeader.trim();
    if (trimmedHeader.length > 10 && trimmedHeader.length < 5000) {
      logger.debug('Token extracted from Authorization header (fallback)', {
        ip: req.ip,
        tokenLength: trimmedHeader?.length,
        tokenStart: trimmedHeader?.substring(0, 20),
      });
      return trimmedHeader;
    }

    logger.warn('Authorization header found but too short or invalid', {
      ip: req.ip,
      headerLength: authHeader.length,
      headerValue: authHeader,
    });
  }

  // Priority 2: Check Auth0 Next.js SDK session cookie
  const cookies = req.cookies || {};
  const auth0Session = cookies[AUTH0_SESSION_COOKIE];

  if (auth0Session) {
    logger.debug('Token extracted from Auth0 session cookie', {
      ip: req.ip,
      cookieName: AUTH0_SESSION_COOKIE,
      cookieLength: auth0Session?.length,
    });

    // Parse the session cookie to extract JWT
    try {
      // Auth0 SDK stores session as: sessionId|userId|token...
      const parts = auth0Session.split('|');
      if (parts.length >= 3) {
        // The actual token is the third part
        const token = parts[2];
        logger.debug('Parsed token from Auth0 session cookie', {
          ip: req.ip,
          tokenStart: token.substring(0, 20) + '...',
        });
        return token;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Failed to parse Auth0 session cookie', {
        error: errorMessage,
      });
    }
  }

  // Priority 3: Fallback to legacy access_token cookie
  const legacyCookie = cookies.access_token;
  if (legacyCookie) {
    logger.debug('Token extracted from legacy cookie', {
      ip: req.ip,
      cookieName: 'access_token',
    });
    return legacyCookie;
  }

  // No token found
  logger.warn('No authentication token found in request', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    hasAuthHeader: !!authHeader,
    hasAuth0Session: !!auth0Session,
    hasLegacyCookie: !!legacyCookie,
    availableCookies: Object.keys(cookies),
  });

  return null;
};

// Verify JWT token with basic validation
const verifyToken = (token: string): any => {
  try {
    // For now, decode without JWKS verification (temporary)
    // TODO: Implement proper JWKS verification with Auth0 SDK
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Token verification failed', {
      error: errorMessage,
      stack: errorStack,
    });
    throw error;
  }
};

// Middleware to verify JWT token
export const verifyJWT = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify and decode token
    const decoded = verifyToken(token);

    // Log decoded token info for debugging
    logger.info('Authentication successful', {
      ip: req.ip,
      subject: decoded.sub,
      email: decoded.email,
      role: decoded['https://craftique.com/role'],
    });

    // Extract user info from token with proper role mapping
    const role = decoded['https://craftique-api/roles']?.[0] ||
                  decoded['https://yourstore.com/role'] ||
                  decoded.role ||
                  decoded['https://auth0.com/roles']?.[0] ||
                  decoded['https://craftique.com/role'] ||
                  'customer';

    // Normalize role names
    const normalizedRole = role.toLowerCase();
    const validRoles = ['customer', 'moderator', 'admin'];
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'customer';

    // Extract permissions from various possible locations
    const permissions = decoded['https://yourstore.com/permissions'] ||
                       decoded.permissions ||
                       decoded['https://auth0.com/permissions'] ||
                       decoded['https://craftique-api/permissions'] ||
                       [];

    req.user = {
      id: decoded.sub, // Will be mapped to internal user ID in service layer
      auth0_id: decoded.sub,
      email: decoded.email || decoded['https://yourstore.com/email'],
      role: finalRole,
      permissions: Array.isArray(permissions) ? permissions : [],
    };

    next();
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : typeof error;

    logger.warn('JWT verification failed', {
      error: errorMessage,
      errorType: errorType,
      ip: req.ip,
      method: req.method,
      path: req.path,
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.cookies,
      availableCookies: Object.keys(req.cookies || {}),
    });

    if (error.message?.includes('expired')) {
      throw new AuthenticationError('Token has expired');
    }
    if (error.message?.includes('Invalid token')) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Authentication failed');
  }
};

// Middleware to require specific role
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError(`Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

// Middleware to require specific permission
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const hasPermission = permissions.some(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission && req.user.role !== 'admin') {
      throw new AuthorizationError(`Required permission: ${permissions.join(' or ')}`);
    }

    next();
  };
};

// Middleware to check resource ownership
export const requireOwnership = (userIdParam: string = 'user_id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin and moderators can access any resource
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      return next();
    }

    // Check if user owns resource
    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    if (resourceUserId && resourceUserId !== req.user.id) {
      return next(new AuthorizationError('Access denied: You can only access your own resources'));
    }

    next();
  };
};

// Middleware for role-based resource access
export const requireRoleForAction = (action: string, resource: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const { role } = req.user;

    // Define RBAC matrix
    const rbacMatrix: Record<string, Record<string, string[]>> = {
      // Categories
      categories: {
        read: ['customer', 'moderator', 'admin'],
        create: ['moderator', 'admin'],
        update: ['moderator', 'admin'],
        delete: ['admin'],
      },
      // Items
      items: {
        read: ['customer', 'moderator', 'admin'],
        create: ['moderator', 'admin'],
        update: ['moderator', 'admin'],
        delete: ['admin'],
      },
      // Reviews
      reviews: {
        read: ['customer', 'moderator', 'admin'],
        create: ['customer', 'moderator', 'admin'],
        update_own: ['customer', 'moderator', 'admin'],
        update_any: ['moderator', 'admin'],
        delete_own: ['customer', 'moderator', 'admin'],
        delete_any: ['moderator', 'admin'],
        approve: ['moderator', 'admin'],
      },
      // Orders
      orders: {
        read_own: ['customer', 'moderator', 'admin'],
        read_any: ['moderator', 'admin'],
        update: ['moderator', 'admin'],
        delete: ['admin'],
        cancel_own: ['customer', 'moderator', 'admin'],
        cancel_any: ['admin'],
      },
      // Users
      users: {
        read_own: ['customer', 'moderator', 'admin'],
        read_any: ['moderator', 'admin'],
        create: ['admin'],
        update_own: ['customer', 'moderator', 'admin'],
        update_any: ['admin'],
        delete: ['admin'],
      },
      // Analytics
      analytics: {
        read: ['admin'],
      },
    };

    const resourcePermissions = rbacMatrix[resource];
    if (!resourcePermissions) {
      return next(new AuthorizationError(`Unknown resource: ${resource}`));
    }

    const allowedRoles = resourcePermissions[action];
    if (!allowedRoles) {
      return next(new AuthorizationError(`Unknown action: ${action} for resource: ${resource}`));
    }

    if (!allowedRoles.includes(role)) {
      return next(new AuthorizationError(`Access denied: ${role} role cannot perform ${action} on ${resource}`));
    }

    next();
  };
};

// Middleware for review ownership or moderator/admin access
export const requireReviewOwnershipOrModerator = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin and moderators can access any review
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      return next();
    }

    // For customers, check if they own review
    const reviewId = req.params.review_id;
    if (!reviewId) {
      return next(new AuthorizationError('Review ID is required'));
    }

    try {
      // Import dynamically to avoid circular dependency
      const { ReviewRepository } = await import('../repositories/review.repository');
      const reviewRepository = new ReviewRepository();

      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        return next(new AuthorizationError('Review not found'));
      }

      // Map auth0_id to internal user ID
      const { UserRepository } = await import('../repositories/user.repository');
      const userRepository = new UserRepository();
      const user = await userRepository.findByAuth0Id(req.user.auth0_id);

      if (!user || review.user_id !== user.id) {
        return next(new AuthorizationError('Access denied: You can only access your own reviews'));
      }

      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error checking review ownership', { error: errorMessage, reviewId });
      return next(new AuthorizationError('Error checking review ownership'));
    }
  };
};

// Middleware for order ownership or moderator/admin access
export const requireOrderOwnershipOrModerator = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin and moderators can access any order
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      return next();
    }

    // For customers, check if they own order
    const orderId = req.params.order_id || req.params.id;
    if (!orderId) {
      return next(new AuthorizationError('Order ID is required'));
    }

    try {
      const { OrderRepository } = await import('../repositories/order.repository');
      const orderRepository = new OrderRepository();

      const order = await orderRepository.findById(orderId);
      if (!order) {
        return next(new AuthorizationError('Order not found'));
      }

      // Map auth0_id to internal user ID
      const { UserRepository } = await import('../repositories/user.repository');
      const userRepository = new UserRepository();
      const user = await userRepository.findByAuth0Id(req.user.auth0_id);

      if (!user || order.user_id !== user.id) {
        return next(new AuthorizationError('Access denied: You can only access your own orders'));
      }

      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error checking order ownership', { error: errorMessage, orderId });
      return next(new AuthorizationError('Error checking order ownership'));
    }
  };
};

// Export management client for use in services
export { managementClient };

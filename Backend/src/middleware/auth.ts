import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
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

// JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Get signing key from Auth0
const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Verify JWT token from Auth0
export async function verifyAuth0Token(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: config.auth0.audience,
        issuer: config.auth0.issuer,
        algorithms: ['RS256'], // Auth0 uses RS256
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

// Middleware to verify JWT token from HttpOnly cookie
export const verifyJWT = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Try to get token from cookie first (HttpOnly cookie)
    let token = req.cookies?.access_token;

    // Fallback to Authorization header for API clients
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify token with Auth0
    const decoded = await verifyAuth0Token(token);

    // Extract user info from token with proper role mapping
    const role = decoded['https://craftique-api/roles']?.[0] ||
                  decoded['https://yourstore.com/role'] ||
                  decoded.role ||
                  decoded['https://auth0.com/roles']?.[0] ||
                  'customer';
    
    // Normalize role names
    const normalizedRole = role.toLowerCase();
    const validRoles = ['customer', 'moderator', 'admin'];
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'customer';

    // Extract permissions from various possible locations
    const permissions = decoded['https://yourstore.com/permissions'] || 
                       decoded.permissions || 
                       decoded['https://auth0.com/permissions'] || 
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
    logger.warn('JWT verification failed', {
      error: error.message,
      ip: req.ip,
    });
    
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
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

    // Check if user owns the resource
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

    // For customers, check if they own the review
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
    } catch (error) {
      logger.error('Error checking review ownership', { error, reviewId });
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

    // For customers, check if they own the order
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
    } catch (error) {
      logger.error('Error checking order ownership', { error, orderId });
      return next(new AuthorizationError('Error checking order ownership'));
    }
  };
};


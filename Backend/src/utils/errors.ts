import { Response } from 'express';
import { logger } from './logger';
import { config } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(400, message, true);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, true);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, true);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export const errorHandler = (err: Error, req: any, res: Response, _next: any) => {
  // Log error details internally
  logger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      user: req.user?.id,
    },
  });

  // Don't leak error details in production
  if (config.nodeEnv === 'production' && !(err instanceof AppError)) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
    return;
  }

  // Handle known errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.constructor.name.replace('Error', ''),
      message: err.message,
      ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Handle Prisma errors - prevent database schema leaks
  // Check for all Prisma error types to prevent schema information leakage
  if (err.name === 'PrismaClientKnownRequestError' || 
      err.name === 'PrismaClientUnknownRequestError' ||
      err.name === 'PrismaClientValidationError' ||
      err.name === 'PrismaClientInitializationError' ||
      err.name === 'PrismaClientRustPanicError') {
    const prismaError = err as any;
    
    // Only handle specific known error codes that are safe to expose
    if (prismaError.code === 'P2002') {
      // Unique constraint violation - safe to expose
      res.status(409).json({
        error: 'Conflict',
        message: 'A record with this value already exists',
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      // Record not found - safe to expose
      res.status(404).json({
        error: 'NotFound',
        message: 'Record not found',
      });
      return;
    }
    
    // For all other Prisma errors, return generic message to prevent schema leaks
    // This prevents leaking table names, column names, constraint names, etc.
    logger.error('Prisma error occurred', {
      error: {
        name: err.name,
        code: prismaError.code,
        message: err.message,
        meta: prismaError.meta,
      },
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
    return;
  }

  // Handle database connection errors
  if (err.message && (
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('database') ||
    err.message.includes('connection') ||
    err.message.includes('SQL') ||
    err.message.includes('syntax error') ||
    err.message.includes('relation') ||
    err.message.includes('column') ||
    err.message.includes('constraint')
  )) {
    // Database-related errors - never expose schema details
    logger.error('Database error occurred', {
      error: {
        name: err.name,
        message: err.message,
      },
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
    return;
  }

  // Generic error response - never expose internal error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};


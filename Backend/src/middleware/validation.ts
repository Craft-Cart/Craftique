import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      console.log('[ValidationMiddleware] validateBody - Validating request body');
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.body = strictSchema.parse(req.body);
      console.log('[ValidationMiddleware] validateBody - Body validated successfully');
      next();
    } catch (error) {
      console.error('[ValidationMiddleware] validateBody - Validation error:', error);
      if (error instanceof ZodError) {
        const details = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      throw error;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      console.log('[ValidationMiddleware] validateQuery - Validating query parameters');
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.query = strictSchema.parse(req.query);
      console.log('[ValidationMiddleware] validateQuery - Query validated successfully');
      next();
    } catch (error) {
      console.error('[ValidationMiddleware] validateQuery - Validation error:', error);
      if (error instanceof ZodError) {
        const details = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Query validation failed', details);
      }
      throw error;
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      console.log('[ValidationMiddleware] validateParams - Validating route parameters');
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.params = strictSchema.parse(req.params);
      console.log('[ValidationMiddleware] validateParams - Parameters validated successfully');
      next();
    } catch (error) {
      console.error('[ValidationMiddleware] validateParams - Validation error:', error);
      if (error instanceof ZodError) {
        const details = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Parameter validation failed', details);
      }
      throw error;
    }
  };
};


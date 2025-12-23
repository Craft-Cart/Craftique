import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

// Middleware to validate request body
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Use passthrough to reject unknown properties (prevent mass assignment)
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.body = strictSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      throw error;
    }
  };
};

// Middleware to validate query parameters
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.query = strictSchema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Query validation failed', details);
      }
      throw error;
    }
  };
};

// Middleware to validate route parameters
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.params = strictSchema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Parameter validation failed', details);
      }
      throw error;
    }
  };
};


import { Request, Response, NextFunction } from 'express';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { z } from 'zod';
import { ValidationError } from '../../utils/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().int().positive(),
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
      };

      validateBody(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
      });
    });

    it('should reject invalid data', () => {
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      validateBody(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should reject unknown properties (prevent mass assignment)', () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        is_admin: true, // Unknown property
      };

      validateBody(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    it('should validate and coerce query parameters', () => {
      mockRequest.query = {
        page: '2',
        limit: '50',
      };

      validateQuery(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({
        page: 2,
        limit: 50,
      });
    });

    it('should use default values when missing', () => {
      mockRequest.query = {};

      validateQuery(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 20,
      });
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    it('should validate UUID parameter', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      validateParams(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid UUID', () => {
      mockRequest.params = {
        id: 'invalid-uuid',
      };

      validateParams(schema)(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});


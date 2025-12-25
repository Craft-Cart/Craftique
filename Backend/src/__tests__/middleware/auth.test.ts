import { Request, Response, NextFunction } from 'express';
import { requireRole, requireOwnership } from '../../middleware/auth';
import { AuthenticationError, AuthorizationError } from '../../utils/errors';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
      headers: {},
      params: {},
      body: {},
      user: undefined,
      ip: '127.0.0.1',
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access with correct role', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'admin@example.com',
        role: 'admin',
        permissions: [],
      };

      const middleware = requireRole('admin');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access with wrong role', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
      };

      const middleware = requireRole('admin');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should allow access with one of multiple roles', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'mod@example.com',
        role: 'moderator',
        permissions: [],
      };

      const middleware = requireRole('admin', 'moderator');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole('admin');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });

  describe('requireOwnership', () => {
    it('should allow admin to access any resource', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'admin@example.com',
        role: 'admin',
        permissions: [],
      };
      mockRequest.params = { user_id: 'user-2' };

      const middleware = requireOwnership('user_id');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow user to access own resource', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
      };
      mockRequest.params = { user_id: 'user-1' };

      const middleware = requireOwnership('user_id');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny user access to other user resource', () => {
      mockRequest.user = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'user@example.com',
        role: 'customer',
        permissions: [],
      };
      mockRequest.params = { user_id: 'user-2' };

      const middleware = requireOwnership('user_id');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;
      mockRequest.params = { user_id: 'user-1' };

      const middleware = requireOwnership('user_id');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });
});

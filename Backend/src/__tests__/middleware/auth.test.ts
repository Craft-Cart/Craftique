import { Request, Response, NextFunction } from 'express';
import { verifyJWT, requireRole, requireOwnership } from '../../middleware/auth';
import { AuthenticationError, AuthorizationError } from '../../utils/errors';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');

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
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('verifyJWT', () => {
    it('should verify token from cookie', async () => {
      const mockDecoded = {
        sub: 'auth0|123',
        email: 'test@example.com',
        'https://yourstore.com/role': 'customer',
        'https://yourstore.com/permissions': [],
      };

      mockRequest.cookies = { access_token: 'valid-token' };
      (jwt.verify as jest.Mock).mockImplementation((token, getKey, options, callback) => {
        callback(null, mockDecoded);
      });

      // Mock the verifyAuth0Token function
      const { verifyAuth0Token } = require('../../middleware/auth');
      jest.spyOn(require('../../middleware/auth'), 'verifyAuth0Token').mockResolvedValue(mockDecoded);

      await verifyJWT(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should verify token from Authorization header', async () => {
      const mockDecoded = {
        sub: 'auth0|123',
        email: 'test@example.com',
        role: 'customer',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      jest.spyOn(require('../../middleware/auth'), 'verifyAuth0Token').mockResolvedValue(mockDecoded);

      await verifyJWT(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw AuthenticationError when no token provided', async () => {
      mockRequest.cookies = {};
      mockRequest.headers = {};

      await verifyJWT(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
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
  });
});


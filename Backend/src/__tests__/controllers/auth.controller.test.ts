import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { setAuthCookie } from '../../middleware/cookies';

jest.mock('../../services/auth.service');
jest.mock('../../middleware/cookies');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    authController = new AuthController();
    (authController as any).authService = mockAuthService;

    mockRequest = {
      body: {},
      cookies: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and set cookies', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(setAuthCookie).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Login failed');
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };
      mockAuthService.login.mockRejectedValue(error);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: 'user-new',
          email: 'new@example.com',
          name: 'New User',
        },
      };

      mockRequest.body = registerData;
      mockAuthService.register.mockResolvedValue(mockResult);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerData.email,
        registerData.password,
        registerData.name,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh token from body', async () => {
      const mockResult = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 86400,
      };

      mockRequest.body = { refresh_token: 'refresh-token' };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should refresh token from cookie', async () => {
      const mockResult = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 86400,
      };

      mockRequest.cookies = { refresh_token: 'refresh-token' };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh-token');
    });

    it('should return 400 when no refresh token provided', async () => {
      mockRequest.body = {};
      mockRequest.cookies = {};

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { clearAuthCookies } = require('../../middleware/cookies');
      clearAuthCookies.mockImplementation(() => {});

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });
});


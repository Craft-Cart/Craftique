import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { AuthenticationError, ConflictError } from '../../utils/errors';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../repositories/user.repository');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService();
    (authService as any).userRepository = mockUserRepository;
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with existing user', async () => {
      const mockAuth0Response = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 86400,
        },
      };

      const mockUserInfo = {
        data: {
          sub: 'auth0|123',
          email: 'test@example.com',
          email_verified: true,
          name: 'Test User',
        },
      };

      const mockUser = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        permissions: [],
      };

      mockedAxios.post.mockResolvedValueOnce(mockAuth0Response);
      mockedAxios.get.mockResolvedValueOnce(mockUserInfo);
      mockUserRepository.findByAuth0Id.mockResolvedValue(mockUser as any);
      mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.access_token).toBe('access-token');
      expect(result.user).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({
          username: 'test@example.com',
          password: 'password123',
        })
      );
    });

    it('should create new user on first login', async () => {
      const mockAuth0Response = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 86400,
        },
      };

      const mockUserInfo = {
        data: {
          sub: 'auth0|new',
          email: 'new@example.com',
          email_verified: true,
          name: 'New User',
        },
      };

      const newUser = {
        id: 'user-new',
        auth0_id: 'auth0|new',
        email: 'new@example.com',
        name: 'New User',
        role: 'customer',
        permissions: [],
      };

      mockedAxios.post.mockResolvedValueOnce(mockAuth0Response);
      mockedAxios.get.mockResolvedValueOnce(mockUserInfo);
      mockUserRepository.findByAuth0Id.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser as any);

      const result = await authService.login('new@example.com', 'password123');

      expect(result.user).toEqual(newUser);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw AuthenticationError on invalid credentials', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401 },
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockAuth0CreateResponse = {
        data: {
          user_id: 'auth0|new',
        },
      };

      const mockAuth0LoginResponse = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 86400,
        },
      };

      const mockUserInfo = {
        data: {
          sub: 'auth0|new',
          email: 'new@example.com',
          email_verified: false,
        },
      };

      const newUser = {
        id: 'user-new',
        auth0_id: 'auth0|new',
        email: 'new@example.com',
        name: 'New User',
        role: 'customer',
        permissions: [],
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockedAxios.post
        .mockResolvedValueOnce(mockAuth0CreateResponse)
        .mockResolvedValueOnce(mockAuth0LoginResponse);
      mockedAxios.get.mockResolvedValueOnce(mockUserInfo);
      mockUserRepository.create.mockResolvedValue(newUser as any);
      mockUserRepository.findByAuth0Id.mockResolvedValue(newUser as any);
      mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      const result = await authService.register(
        'new@example.com',
        'password123',
        'New User'
      );

      expect(result.access_token).toBe('access-token');
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing',
        email: 'existing@example.com',
      } as any);

      await expect(
        authService.register('existing@example.com', 'password123', 'User')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 86400,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken('refresh-token');

      expect(result.access_token).toBe('new-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'refresh-token',
        })
      );
    });

    it('should throw AuthenticationError on invalid refresh token', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        AuthenticationError
      );
    });
  });
});


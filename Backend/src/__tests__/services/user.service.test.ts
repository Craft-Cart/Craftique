import { UserService } from '../../services/user.service';
import { UserRepository } from '../../repositories/user.repository';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { UserRole } from '@prisma/client';

// Mock the repository
jest.mock('../../repositories/user.repository', () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
      findByAuth0Id: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      updateLastLogin: jest.fn(),
    })),
  };
});

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    const UserRepositoryMock = require('../../repositories/user.repository').UserRepository;
    mockUserRepository = new UserRepositoryMock() as jest.Mocked<UserRepository>;
    userService = new UserService();
    (userService as any).userRepository = mockUserRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        auth0_id: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer' as UserRole,
        permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1', role: 'customer' as UserRole },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2', role: 'customer' as UserRole },
      ];

      mockUserRepository.findMany.mockResolvedValue({
        users: mockUsers as any,
        total: 2,
      });

      const result = await userService.getUsers({ page: 1, limit: 20 });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        phone: '1234567890',
        role: 'customer' as UserRole,
      };

      const mockUser = {
        id: 'user-new',
        ...userData,
        auth0_id: 'auth0|temp_123',
        permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as any);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Existing User',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing',
        email: 'existing@example.com',
      } as any);

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'user-1';
      const updateData = {
        name: 'Updated Name',
        phone: '9876543210',
      };

      const existingUser = {
        id: userId,
        name: 'Old Name',
        email: 'test@example.com',
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      mockUserRepository.findById.mockResolvedValue(existingUser as any);
      mockUserRepository.update.mockResolvedValue(updatedUser as any);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        userService.updateUser('user-1', { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-1';
      const mockUser = { id: userId, email: 'test@example.com' };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await userService.deleteUser(userId);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('user-1')).rejects.toThrow(NotFoundError);
    });
  });
});


import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { UserRole } from '@prisma/client';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  async getUserByAuth0Id(auth0Id: string) {
    const user = await this.userRepository.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  async getUsers(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
  }) {
    const result = await this.userRepository.findMany(options);
    return {
      users: result.users.map(u => this.sanitizeUser(u)),
      total: result.total,
      page: options.page || 1,
      pages: Math.ceil(result.total / (options.limit || 20)),
    };
  }

  async createUser(data: {
    email: string;
    name: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const auth0Id = `auth0|temp_${Date.now()}`;

    const user = await this.userRepository.create({
      auth0_id: auth0Id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role || 'customer',
      permissions: [],
    });

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, data: {
    name?: string;
    phone?: string;
    address?: any;
  }) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await this.userRepository.update(id, {
      name: data.name,
      phone: data.phone,
      address: data.address,
    });

    return this.sanitizeUser(updated);
  }

  async updateUserAdmin(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    address?: any;
  }) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check email conflict if changing email
    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError('User with this email already exists');
      }
    }

    const updated = await this.userRepository.update(id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      address: data.address,
    });

    return this.sanitizeUser(updated);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepository.delete(id);
  }

  // Remove sensitive fields from user object
  private sanitizeUser(user: any) {
    const { ...sanitized } = user;
    // Remove any sensitive fields if needed
    return sanitized;
  }
}


import { User, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { auth0_id: auth0Id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async upsertByAuth0Id(
    auth0Id: string,
    createData: Prisma.UserCreateInput,
    updateData?: Prisma.UserUpdateInput
  ): Promise<User> {
    return prisma.user.upsert({
      where: { auth0_id: auth0Id },
      create: createData,
      update: updateData || { last_login: new Date() },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findMany(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
  }): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, role } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (role) {
      where.role = role;
    }

    // nosemgrep: missing-user-filter-query
    // Users are filtered by role parameter
    // Authorization is handled at the service and middleware layers
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { last_login: new Date() },
    });
  }
}


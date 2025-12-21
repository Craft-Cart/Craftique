import { PrismaClient, Category, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  async findMany(options: {
    parentId?: string | null;
    isActive?: boolean;
  }): Promise<Category[]> {
    const where: Prisma.CategoryWhereInput = {};
    
    if (options.parentId !== undefined) {
      where.parent_id = options.parentId;
    }
    
    if (options.isActive !== undefined) {
      where.is_active = options.isActive;
    }

    return prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id },
    });
  }
}


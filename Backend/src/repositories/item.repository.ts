import { Item, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class ItemRepository {
  async findById(id: string): Promise<Item | null> {
    return prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Item | null> {
    return prisma.item.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });
  }

  async findBySku(sku: string): Promise<Item | null> {
    return prisma.item.findUnique({
      where: { sku },
    });
  }

  async findMany(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    sortBy?: string;
  }): Promise<{ items: Item[]; total: number }> {
    const { page = 1, limit = 20, categoryId, isActive, isFeatured, search, sortBy } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};
    
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    
    if (isFeatured !== undefined) {
      where.is_featured = isFeatured;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ItemOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'name':
        orderBy.name = 'asc';
        break;
      case 'newest':
        orderBy.created_at = 'desc';
        break;
      case 'popular':
        // This would require a join with reviews/orders - simplified for now
        orderBy.created_at = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    // nosemgrep: missing-user-filter-query
    // Items are public data accessed by all users
    // Authorization is handled at the service and middleware layers
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
        },
      }),
      prisma.item.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: Prisma.ItemCreateInput): Promise<Item> {
    return prisma.item.create({
      data,
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: Prisma.ItemUpdateInput): Promise<Item> {
    return prisma.item.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.item.delete({
      where: { id },
    });
  }

  async updateQuantity(id: string, quantity: number): Promise<Item> {
    return prisma.item.update({
      where: { id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
  }

  async findByIds(ids: string[]): Promise<Item[]> {
    // nosemgrep: missing-user-filter-query
    // Items are public data accessed by all users
    // Authorization is handled at the service and middleware layers
    return prisma.item.findMany({
      where: {
        id: { in: ids },
      },
    });
  }
}


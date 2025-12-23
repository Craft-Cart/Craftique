import { Review, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class ReviewRepository {
  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        item: true,
      },
    });
  }

  async findByItemId(itemId: string, options: {
    page?: number;
    limit?: number;
  }): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      item_id: itemId,
      is_approved: true, // Only show approved reviews
    };

    const [reviews, total, allReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where: { item_id: itemId, is_approved: true },
        select: { rating: true },
      }),
    ]);

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    return { reviews, total, averageRating };
  }

  async create(data: Prisma.ReviewCreateInput): Promise<Review> {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        item: true,
      },
    });
  }

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        item: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.review.delete({
      where: { id },
    });
  }

  async approve(id: string): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data: { is_approved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        item: true,
      },
    });
  }

  async findByUserAndItem(userId: string, itemId: string): Promise<Review | null> {
    return prisma.review.findFirst({
      where: {
        user_id: userId,
        item_id: itemId,
      },
    });
  }
}


import { PrismaClient } from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class WishlistService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { user_id: userId },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      wishlist,
      products: wishlist.map(w => w.item),
    };
  }

  async addToWishlist(userId: string, itemId: string) {
    // Check if already in wishlist
    const existing = await this.prisma.wishlist.findFirst({
      where: {
        user_id: userId,
        item_id: itemId,
      },
    });

    if (existing) {
      throw new ConflictError('Item already in wishlist');
    }

    // Verify item exists
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        user_id: userId,
        item_id: itemId,
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    logger.info('Item added to wishlist', {
      userId,
      itemId,
      wishlistId: wishlistItem.id,
    });

    return wishlistItem;
  }

  async removeFromWishlist(userId: string, wishlistId: string) {
    const wishlistItem = await this.prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        user_id: userId,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    await this.prisma.wishlist.delete({
      where: { id: wishlistId },
    });

    logger.info('Item removed from wishlist', {
      userId,
      wishlistId,
      itemId: wishlistItem.item_id,
    });
  }

  async clearWishlist(userId: string) {
    await this.prisma.wishlist.deleteMany({
      where: { user_id: userId },
    });

    logger.info('Wishlist cleared', { userId });
  }
}
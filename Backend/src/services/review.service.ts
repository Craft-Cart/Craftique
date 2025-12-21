import { ReviewRepository } from '../repositories/review.repository';
import { ItemRepository } from '../repositories/item.repository';
import { NotFoundError, ConflictError } from '../utils/errors';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private itemRepository: ItemRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.itemRepository = new ItemRepository();
  }

  async getReviewsByItemId(itemId: string, options: {
    page?: number;
    limit?: number;
  }) {
    // Verify item exists
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Item');
    }

    return this.reviewRepository.findByItemId(itemId, options);
  }

  async createReview(userId: string, itemId: string, data: {
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }) {
    // Verify item exists
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Item');
    }

    // Check if user already reviewed this item
    const existing = await this.reviewRepository.findByUserAndItem(userId, itemId);
    if (existing) {
      throw new ConflictError('You have already reviewed this item');
    }

    // Auto-approve for now (can be changed to require moderation)
    const isApproved = true;

    return this.reviewRepository.create({
      item: {
        connect: { id: itemId },
      },
      user: {
        connect: { id: userId },
      },
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      images: data.images || [],
      is_approved: isApproved,
      verified_purchase: false, // Could be enhanced to check order history
    });
  }

  async updateReview(reviewId: string, userId: string, data: {
    rating?: number;
    title?: string;
    comment?: string;
  }) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Check ownership (users can only update their own reviews)
    if (review.user_id !== userId) {
      throw new ConflictError('You can only update your own reviews');
    }

    return this.reviewRepository.update(reviewId, {
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    });
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Check ownership or admin/mod role
    if (review.user_id !== userId && userRole !== 'admin' && userRole !== 'moderator') {
      throw new ConflictError('You can only delete your own reviews');
    }

    await this.reviewRepository.delete(reviewId);
  }

  async approveReview(reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    return this.reviewRepository.approve(reviewId);
  }
}


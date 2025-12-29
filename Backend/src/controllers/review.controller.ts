import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ReviewController] getReviews - Request received');
      const { item_id } = req.params;
      const { page, limit } = req.query;
      console.log('[ReviewController] getReviews - Query params:', { item_id, page, limit });
      const result = await this.reviewService.getReviewsByItemId(item_id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      console.log('[ReviewController] getReviews - Retrieved', result.reviews?.length || 0, 'reviews');
      return res.json(result);
    } catch (error) {
      console.error('[ReviewController] getReviews - Error:', error);
      return next(error);
    }
  };

  createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ReviewController] createReview - Request received');
      if (!req.user) {
        console.log('[ReviewController] createReview - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { item_id } = req.params;
      const { rating, title, comment, images } = req.body;
      console.log('[ReviewController] createReview - Creating review for item:', item_id, 'with rating:', rating);

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const review = await this.reviewService.createReview(user.id, item_id, {
        rating,
        title,
        comment,
        images,
      });
      console.log('[ReviewController] createReview - Review created:', review.id);
      return res.status(201).json(review);
    } catch (error) {
      console.error('[ReviewController] createReview - Error:', error);
      return next(error);
    }
  };

  updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ReviewController] updateReview - Request received');
      if (!req.user) {
        console.log('[ReviewController] updateReview - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { review_id } = req.params;
      const { rating, title, comment } = req.body;
      console.log('[ReviewController] updateReview - Updating review:', review_id);

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const review = await this.reviewService.updateReview(review_id, user.id, {
        rating,
        title,
        comment,
      });
      console.log('[ReviewController] updateReview - Review updated');
      return res.json(review);
    } catch (error) {
      console.error('[ReviewController] updateReview - Error:', error);
      return next(error);
    }
  };

  deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ReviewController] deleteReview - Request received');
      if (!req.user) {
        console.log('[ReviewController] deleteReview - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { review_id } = req.params;
      console.log('[ReviewController] deleteReview - Deleting review:', review_id);

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      await this.reviewService.deleteReview(review_id, user.id, req.user.role);
      console.log('[ReviewController] deleteReview - Review deleted');
      return res.status(204).send();
    } catch (error) {
      console.error('[ReviewController] deleteReview - Error:', error);
      return next(error);
    }
  };

  approveReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ReviewController] approveReview - Request received');
      const { review_id } = req.params;
      console.log('[ReviewController] approveReview - Approving review:', review_id);
      const review = await this.reviewService.approveReview(review_id);
      console.log('[ReviewController] approveReview - Review approved');
      res.json(review);
    } catch (error) {
      console.error('[ReviewController] approveReview - Error:', error);
      next(error);
    }
  };
}


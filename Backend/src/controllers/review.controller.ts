import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item_id } = req.params;
      const { page, limit } = req.query;
      const result = await this.reviewService.getReviewsByItemId(item_id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { item_id } = req.params;
      const { rating, title, comment, images } = req.body;

      // Get internal user ID
      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const review = await this.reviewService.createReview(user.id, item_id, {
        rating,
        title,
        comment,
        images,
      });
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  };

  updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { review_id } = req.params;
      const { rating, title, comment } = req.body;

      // Get internal user ID
      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const review = await this.reviewService.updateReview(review_id, user.id, {
        rating,
        title,
        comment,
      });
      res.json(review);
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { review_id } = req.params;

      // Get internal user ID
      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      await this.reviewService.deleteReview(review_id, user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  approveReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { review_id } = req.params;
      const review = await this.reviewService.approveReview(review_id);
      res.json(review);
    } catch (error) {
      next(error);
    }
  };
}


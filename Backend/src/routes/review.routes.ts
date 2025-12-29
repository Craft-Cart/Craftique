import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { verifyJWT, requireRole, requireReviewOwnershipOrModerator } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
  reviewQuerySchema,
  approveReviewSchema,
} from '../validators/schemas';

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get(
  '/items/:item_id/reviews',
  validateParams(reviewParamsSchema),
  validateQuery(reviewQuerySchema),
  reviewController.getReviews
);

// Protected routes
router.post(
  '/items/:item_id/reviews',
  verifyJWT,
  validateParams(reviewParamsSchema),
  validateBody(createReviewSchema),
  reviewController.createReview
);
router.put(
  '/reviews/:review_id',
  verifyJWT,
  requireReviewOwnershipOrModerator(),
  validateParams(reviewParamsSchema),
  validateBody(updateReviewSchema),
  reviewController.updateReview
);
router.delete(
  '/reviews/:review_id',
  verifyJWT,
  requireReviewOwnershipOrModerator(),
  validateParams(reviewParamsSchema),
  reviewController.deleteReview
);
router.post(
  '/reviews/:review_id/approve',
  verifyJWT,
  requireRole('admin', 'moderator'),
  validateParams(reviewParamsSchema),
  validateBody(approveReviewSchema),
  reviewController.approveReview
);

export default router;


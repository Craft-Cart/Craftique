import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  categoryQuerySchema,
} from '../validators/schemas';

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get('/', validateQuery(categoryQuerySchema), categoryController.getCategories);
router.get(
  '/:category_id',
  validateParams(categoryParamsSchema),
  categoryController.getCategoryById
);

// Protected routes
router.post(
  '/',
  verifyJWT,
  requireRole('admin', 'moderator'),
  validateBody(createCategorySchema),
  categoryController.createCategory
);
router.put(
  '/:category_id',
  verifyJWT,
  requireRole('admin', 'moderator'),
  validateParams(categoryParamsSchema),
  validateBody(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:category_id',
  verifyJWT,
  requireRole('admin'),
  validateParams(categoryParamsSchema),
  categoryController.deleteCategory
);

export default router;


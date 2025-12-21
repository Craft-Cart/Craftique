import { Router } from 'express';
import { ItemController } from '../controllers/item.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createItemSchema,
  updateItemSchema,
  itemParamsSchema,
  itemQuerySchema,
} from '../validators/schemas';

const router = Router();
const itemController = new ItemController();

// Public routes
router.get('/', validateQuery(itemQuerySchema), itemController.getItems);
router.get(
  '/:item_id',
  validateParams(itemParamsSchema),
  itemController.getItemById
);

// Protected routes
router.post(
  '/',
  verifyJWT,
  requireRole('admin', 'moderator'),
  validateBody(createItemSchema),
  itemController.createItem
);
router.put(
  '/:item_id',
  verifyJWT,
  requireRole('admin', 'moderator'),
  validateParams(itemParamsSchema),
  validateBody(updateItemSchema),
  itemController.updateItem
);
router.delete(
  '/:item_id',
  verifyJWT,
  requireRole('admin'),
  validateParams(itemParamsSchema),
  itemController.deleteItem
);

export default router;


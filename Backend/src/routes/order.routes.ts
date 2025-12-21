import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createOrderSchema,
  updateOrderSchema,
  checkoutSchema,
  orderParamsSchema,
  orderQuerySchema,
} from '../validators/schemas';

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(verifyJWT);

// Order routes
router.get('/', validateQuery(orderQuerySchema), orderController.getOrders);
router.get(
  '/:order_id',
  validateParams(orderParamsSchema),
  orderController.getOrderById
);
router.post('/', validateBody(createOrderSchema), orderController.createOrder);
router.put(
  '/:order_id',
  requireRole('admin', 'moderator'),
  validateParams(orderParamsSchema),
  validateBody(updateOrderSchema),
  orderController.updateOrder
);
router.delete(
  '/:order_id',
  validateParams(orderParamsSchema),
  orderController.cancelOrder
);

// Checkout route
router.post(
  '/:order_id/checkout',
  validateParams(orderParamsSchema),
  validateBody(checkoutSchema),
  orderController.checkout
);

export default router;


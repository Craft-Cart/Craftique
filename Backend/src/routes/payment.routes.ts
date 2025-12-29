import { Router } from 'express';
import express from 'express';
import { OrderController } from '../controllers/order.controller';
import { validateBody } from '../middleware/validation';
import { paymobCallbackSchema } from '../validators/schemas';

const router = Router();
const orderController = new OrderController();

// Paymob webhook callback (public, but HMAC protected)
// This route needs raw body for HMAC verification
router.post(
  '/paymob/callback',
  express.raw({ type: 'application/json', limit: '1mb' }),
  (req: any, res: any, next: any) => {
    // Parse the raw body to JSON for the controller
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
  },
  validateBody(paymobCallbackSchema),
  orderController.paymobCallback
);

// Paymob response page (public)
router.get('/paymob/response', orderController.paymobResponse);

export default router;

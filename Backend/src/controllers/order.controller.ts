import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';

export class OrderController {
  private orderService: OrderService;
  private paymentService: PaymentService;

  constructor() {
    this.orderService = new OrderService();
    this.paymentService = new PaymentService();
  }

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] getOrders - Request received');
      const { page, limit, status, user_id } = req.query;
      console.log('[OrderController] getOrders - Query params:', { page, limit, status, user_id });

      let userId = user_id as string | undefined;
      if (req.user && req.user.role === 'customer') {
        const { UserService } = require('../services/user.service');
        const userService = new UserService();
        const user = await userService.getUserByAuth0Id(req.user.auth0_id);
        userId = user.id;
      }

      const result = await this.orderService.getOrders({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        userId,
        status: status as string,
      });
      console.log('[OrderController] getOrders - Retrieved', result.orders?.length || 0, 'orders');
      res.json(result);
    } catch (error) {
      console.error('[OrderController] getOrders - Error:', error);
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] getOrderById - Request received');
      const { order_id } = req.params;
      console.log('[OrderController] getOrderById - Fetching order:', order_id);

      let userId: string | undefined;
      if (req.user) {
        const { UserService } = require('../services/user.service');
        const userService = new UserService();
        const user = await userService.getUserByAuth0Id(req.user.auth0_id);
        userId = user.id;
      }

      const order = await this.orderService.getOrderById(order_id, userId);
      console.log('[OrderController] getOrderById - Order retrieved:', order.id);
      return res.json(order);
    } catch (error) {
      console.error('[OrderController] getOrderById - Error:', error);
      return next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] createOrder - Request received');
      if (!req.user) {
        console.log('[OrderController] createOrder - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { items, shipping_address, billing_address, notes } = req.body;
      console.log('[OrderController] createOrder - Creating order with', items.length, 'items');

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const order = await this.orderService.createOrder(user.id, {
        items,
        shippingAddress: shipping_address,
        billingAddress: billing_address,
        notes,
      });
      console.log('[OrderController] createOrder - Order created:', order.id);
      return res.status(201).json(order);
    } catch (error) {
      console.error('[OrderController] createOrder - Error:', error);
      return next(error);
    }
  };

  updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] updateOrder - Request received');
      if (!req.user) {
        console.log('[OrderController] updateOrder - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;
      const { status, notes } = req.body;
      console.log('[OrderController] updateOrder - Updating order:', order_id, 'to status:', status);

      const order = await this.orderService.updateOrder(order_id, {
        status,
        notes,
      }, req.user.role);
      console.log('[OrderController] updateOrder - Order updated');
      return res.json(order);
    } catch (error) {
      console.error('[OrderController] updateOrder - Error:', error);
      return next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] cancelOrder - Request received');
      if (!req.user) {
        console.log('[OrderController] cancelOrder - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;
      console.log('[OrderController] cancelOrder - Cancelling order:', order_id);

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const order = await this.orderService.cancelOrder(order_id, user.id);
      console.log('[OrderController] cancelOrder - Order cancelled');
      return res.json(order);
    } catch (error) {
      console.error('[OrderController] cancelOrder - Error:', error);
      return next(error);
    }
  };

  checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] checkout - Request received');
      if (!req.user) {
        console.log('[OrderController] checkout - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;
      const { payment_method, billing_data } = req.body;
      console.log('[OrderController] checkout - Processing checkout for order:', order_id, 'with payment method:', payment_method);

      const result = await this.paymentService.requestPaymentKey(
        order_id,
        payment_method,
        billing_data
      );
      console.log('[OrderController] checkout - Checkout initiated');
      return res.json(result);
    } catch (error) {
      console.error('[OrderController] checkout - Error:', error);
      return next(error);
    }
  };

  paymobCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] paymobCallback - Request received');
      const hmac = (req.query.hmac as string) || (req.headers['x-paymob-hmac'] as string);
      if (!hmac) {
        console.log('[OrderController] paymobCallback - HMAC signature missing');
        return res.status(400).json({ error: 'HMAC signature required' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('[OrderController] paymobCallback - Invalid JSON body');
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      console.log('[OrderController] paymobCallback - Processing webhook callback');
      const result = await this.paymentService.handleWebhookCallback(body, hmac);
      console.log('[OrderController] paymobCallback - Webhook processed');
      return res.json(result);
    } catch (error) {
      console.error('[OrderController] paymobCallback - Error:', error);
      return next(error);
    }
  };

  paymobResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[OrderController] paymobResponse - Request received');
      const { success, id, merchant_order_id, hmac } = req.query;
      console.log('[OrderController] paymobResponse - Payment response:', { success, id, merchant_order_id });

      if (hmac) {
      }

      const sanitizedOrderId = String(merchant_order_id || '').replace(/[^a-zA-Z0-9-]/g, '');
      const sanitizedTxnId = String(id || '').replace(/[^a-zA-Z0-9-]/g, '');
      const isSuccess = success === 'true';

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`/orders/${encodeURIComponent(sanitizedOrderId)}`, frontendUrl);
      redirectUrl.searchParams.set('payment_status', isSuccess ? 'success' : 'failed');
      redirectUrl.searchParams.set('txn_id', sanitizedTxnId);

      console.log('[OrderController] paymobResponse - Redirecting to:', redirectUrl.toString());
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('[OrderController] paymobResponse - Error:', error);
      next(error);
    }
  };
}


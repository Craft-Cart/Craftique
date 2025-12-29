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
      const { page, limit, status, user_id } = req.query;

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
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { order_id } = req.params;

      let userId: string | undefined;
      if (req.user) {
        const { UserService } = require('../services/user.service');
        const userService = new UserService();
        const user = await userService.getUserByAuth0Id(req.user.auth0_id);
        userId = user.id;
      }

      const order = await this.orderService.getOrderById(order_id, userId);
      return res.json(order);
    } catch (error) {
      return next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { items, shipping_address, billing_address, notes } = req.body;

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const order = await this.orderService.createOrder(user.id, {
        items,
        shippingAddress: shipping_address,
        billingAddress: billing_address,
        notes,
      });
      return res.status(201).json(order);
    } catch (error) {
      return next(error);
    }
  };

  updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;
      const { status, notes } = req.body;

      const order = await this.orderService.updateOrder(order_id, {
        status,
        notes,
      }, req.user.role);
      return res.json(order);
    } catch (error) {
      return next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;

      const { UserService } = require('../services/user.service');
      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(req.user.auth0_id);

      const order = await this.orderService.cancelOrder(order_id, user.id);
      return res.json(order);
    } catch (error) {
      return next(error);
    }
  };

  checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { order_id } = req.params;
      const { payment_method, billing_data } = req.body;

      const result = await this.paymentService.requestPaymentKey(
        order_id,
        payment_method,
        billing_data
      );
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

  paymobCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hmac = (req.query.hmac as string) || (req.headers['x-paymob-hmac'] as string);
      if (!hmac) {
        return res.status(400).json({ error: 'HMAC signature required' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const result = await this.paymentService.handleWebhookCallback(body, hmac);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

  paymobResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success, id, merchant_order_id, hmac } = req.query;

      if (hmac) {
      }

      const sanitizedOrderId = String(merchant_order_id || '').replace(/[^a-zA-Z0-9-]/g, '');
      const sanitizedTxnId = String(id || '').replace(/[^a-zA-Z0-9-]/g, '');
      const isSuccess = success === 'true';

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`/orders/${encodeURIComponent(sanitizedOrderId)}`, frontendUrl);
      redirectUrl.searchParams.set('payment_status', isSuccess ? 'success' : 'failed');
      redirectUrl.searchParams.set('txn_id', sanitizedTxnId);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  };
}


import { OrderRepository } from '../repositories/order.repository';
import { ItemRepository } from '../repositories/item.repository';
import { ItemService } from './item.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateOrderNumber } from '../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';

export class OrderService {
  private orderRepository: OrderRepository;
  private itemRepository: ItemRepository;
  private itemService: ItemService;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.itemRepository = new ItemRepository();
    this.itemService = new ItemService();
  }

  async getOrderById(id: string, userId?: string) {
    console.log('[OrderService] getOrderById - Fetching order:', id);
    const order = await this.orderRepository.findById(id);
    if (!order) {
      console.log('[OrderService] getOrderById - Order not found');
      throw new NotFoundError('Order');
    }

    if (userId && order.user_id !== userId) {
      console.log('[OrderService] getOrderById - Access denied');
      throw new ValidationError('Access denied');
    }

    console.log('[OrderService] getOrderById - Order retrieved');
    return order;
  }

  async getOrders(options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
  }) {
    console.log('[OrderService] getOrders - Fetching orders with options:', options);
    const result = this.orderRepository.findMany({
      ...options,
      status: options.status as any,
    });
    console.log('[OrderService] getOrders - Orders retrieved');
    return result;
  }

  async createOrder(userId: string, data: {
    items: Array<{ itemId: string; quantity: number }>;
    shippingAddress: any;
    billingAddress?: any;
    notes?: string;
  }) {
    console.log('[OrderService] createOrder - Creating order for user:', userId, 'with', data.items.length, 'items');
    const itemIds = data.items.map(item => item.itemId);
    const items = await this.itemRepository.findByIds(itemIds);

    if (items.length !== data.items.length) {
      console.log('[OrderService] createOrder - One or more items not found');
      throw new ValidationError('One or more items not found');
    }

    let subtotal = new Decimal(0);
    const orderItems: any[] = [];

    for (const orderItem of data.items) {
      const item = items.find(i => i.id === orderItem.itemId);
      if (!item) {
        throw new ValidationError(`Item ${orderItem.itemId} not found`);
      }

      if (item.quantity < orderItem.quantity) {
        console.log('[OrderService] createOrder - Insufficient quantity for item:', item.name);
        throw new ValidationError(`Insufficient quantity for item ${item.name}`);
      }

      if (!item.is_active) {
        console.log('[OrderService] createOrder - Item not available:', item.name);
        throw new ValidationError(`Item ${item.name} is not available`);
      }

      const itemTotal = new Decimal(item.price.toString()).mul(orderItem.quantity);
      subtotal = subtotal.add(itemTotal);

      orderItems.push({
        item_id: item.id,
        name: item.name,
        quantity: orderItem.quantity,
        price: item.price,
        total: itemTotal,
      });
    }

    const shipping = new Decimal(50);
    const tax = subtotal.mul(0.14);
    const discount = new Decimal(0);
    const total = subtotal.add(shipping).add(tax).sub(discount);

    await this.itemService.reserveItems(data.items);

    const orderNumber = generateOrderNumber();
    
    const order = await this.orderRepository.create({
      order_number: orderNumber,
      user: {
        connect: { id: userId },
      },
      status: 'pending',
      items: orderItems, // Store as JSON snapshot
      subtotal,
      tax,
      shipping,
      discount,
      total,
      currency: 'EGP',
      shipping_address: data.shippingAddress,
      billing_address: data.billingAddress || data.shippingAddress,
      payment_status: 'pending',
      notes: data.notes,
    });

    // Note: Order items are stored as JSON snapshot in the order.items field
    // In a real implementation, you'd also create OrderItem records for relational queries
    // This is simplified for clarity

    return order;
  }

  async updateOrder(id: string, data: {
    status?: string;
    notes?: string;
  }, userRole: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Only admin/moderator can update order status
    if (data.status && userRole !== 'admin' && userRole !== 'moderator') {
      throw new ValidationError('Only admins can update order status');
    }

    return this.orderRepository.update(id, {
      status: data.status as any,
      notes: data.notes,
    });
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check ownership
    if (order.user_id !== userId) {
      throw new ValidationError('Access denied');
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      throw new ValidationError('Only pending orders can be cancelled');
    }

    return this.orderRepository.update(id, {
      status: 'cancelled',
    });
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    paymobData?: {
      paymobOrderId?: string;
      paymobTransactionId?: number;
      paymobIntegrationId?: number;
    }
  ) {
    return this.orderRepository.updatePaymentStatus(id, paymentStatus, paymobData);
  }
}


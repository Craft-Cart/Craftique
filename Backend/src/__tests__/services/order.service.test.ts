import { OrderService } from '../../services/order.service';
import { OrderRepository } from '../../repositories/order.repository';
import { ItemRepository } from '../../repositories/item.repository';
import { ItemService } from '../../services/item.service';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../repositories/order.repository');
jest.mock('../../repositories/item.repository');
jest.mock('../../services/item.service');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockItemRepository: jest.Mocked<ItemRepository>;
  let mockItemService: jest.Mocked<ItemService>;

  beforeEach(() => {
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockItemRepository = new ItemRepository() as jest.Mocked<ItemRepository>;
    mockItemService = new ItemService() as jest.Mocked<ItemService>;

    orderService = new OrderService();
    (orderService as any).orderRepository = mockOrderRepository;
    (orderService as any).itemRepository = mockItemRepository;
    (orderService as any).itemService = mockItemService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const userId = 'user-1';
      const orderData = {
        items: [
          { itemId: 'item-1', quantity: 2 },
          { itemId: 'item-2', quantity: 1 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Cairo',
          state: 'Cairo',
          postal_code: '12345',
          country: 'Egypt',
        },
      };

      const mockItems = [
        {
          id: 'item-1',
          name: 'Item 1',
          price: new Decimal(100),
          quantity: 10,
          is_active: true,
        },
        {
          id: 'item-2',
          name: 'Item 2',
          price: new Decimal(50),
          quantity: 5,
          is_active: true,
        },
      ];

      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-123',
        user_id: userId,
        status: 'pending',
        subtotal: new Decimal(250),
        tax: new Decimal(35),
        shipping: new Decimal(50),
        discount: new Decimal(0),
        total: new Decimal(335),
        currency: 'EGP',
        payment_status: 'pending',
      };

      mockItemRepository.findByIds.mockResolvedValue(mockItems as any);
      mockItemService.checkAvailability.mockResolvedValue(true);
      mockItemService.reserveItems.mockResolvedValue(undefined);
      mockOrderRepository.create.mockResolvedValue(mockOrder as any);

      const result = await orderService.createOrder(userId, orderData);

      expect(result).toEqual(mockOrder);
      expect(mockItemService.reserveItems).toHaveBeenCalledWith(orderData.items);
    });

    it('should throw ValidationError when item not found', async () => {
      const userId = 'user-1';
      const orderData = {
        items: [{ itemId: 'item-1', quantity: 1 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Cairo',
          state: 'Cairo',
          postal_code: '12345',
          country: 'Egypt',
        },
      };

      mockItemRepository.findByIds.mockResolvedValue([]);

      await expect(orderService.createOrder(userId, orderData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when insufficient quantity', async () => {
      const userId = 'user-1';
      const orderData = {
        items: [{ itemId: 'item-1', quantity: 100 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Cairo',
          state: 'Cairo',
          postal_code: '12345',
          country: 'Egypt',
        },
      };

      const mockItem = {
        id: 'item-1',
        name: 'Item 1',
        price: new Decimal(100),
        quantity: 10,
        is_active: true,
      };

      mockItemRepository.findByIds.mockResolvedValue([mockItem as any]);
      mockItemService.checkAvailability.mockResolvedValue(false);

      await expect(orderService.createOrder(userId, orderData)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const orderId = 'order-1';
      const mockOrder = {
        id: orderId,
        user_id: 'user-1',
        status: 'pending',
        total: new Decimal(100),
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById(orderId);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(orderService.getOrderById('order-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when user tries to access another user order', async () => {
      const orderId = 'order-1';
      const userId = 'user-2';
      const mockOrder = {
        id: orderId,
        user_id: 'user-1', // Different user
        status: 'pending',
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      await expect(orderService.getOrderById(orderId, userId)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order successfully', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';
      const mockOrder = {
        id: orderId,
        user_id: userId,
        status: 'pending',
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
      } as any);

      const result = await orderService.cancelOrder(orderId, userId);

      expect(result.status).toBe('cancelled');
    });

    it('should throw ValidationError when order is not pending', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';
      const mockOrder = {
        id: orderId,
        user_id: userId,
        status: 'shipped', // Already shipped
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      await expect(orderService.cancelOrder(orderId, userId)).rejects.toThrow(
        ValidationError
      );
    });
  });
});


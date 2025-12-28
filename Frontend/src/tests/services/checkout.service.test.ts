import { CheckoutService } from '@/lib/checkout';
import { API_ENDPOINTS } from '@/lib/endpoints';

// Mock fetch
global.fetch = jest.fn();

describe('CheckoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const items = [
        {
          product: { id: '1', name: 'Product 1', price: 100 },
          quantity: 2,
        },
        {
          product: { id: '2', name: 'Product 2', price: 50 },
          quantity: 1,
        },
      ] as any;

      const totals = CheckoutService.calculateTotals(items);

      expect(totals.subtotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(totals.shipping).toBe(0); // Free shipping for orders >= 100
      expect(totals.tax).toBe(20); // 250 * 0.08
      expect(totals.total).toBe(270); // 250 + 0 + 20
    });

    it('should apply shipping for orders under 100', () => {
      const items = [
        {
          product: { id: '1', name: 'Product 1', price: 50 },
          quantity: 1,
        },
      ] as any;

      const totals = CheckoutService.calculateTotals(items);

      expect(totals.subtotal).toBe(50);
      expect(totals.shipping).toBe(10);
      expect(totals.total).toBe(64); // 50 + 10 + 4 (tax)
    });
  });

  describe('submitOrder', () => {
    it('should submit order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-123',
        status: 'pending',
        total: 270,
      };

      const items = [
        {
          product: { id: '1', name: 'Product 1', price: 100 },
          quantity: 2,
        },
      ] as any;

      const shipping = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Cairo',
        state: 'Cairo',
        zipCode: '12345',
        country: 'Egypt',
      };

      const payment = {
        cardNumber: '4111111111111111',
        cardName: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        billingAddress: shipping,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      });

      const result = await CheckoutService.submitOrder(items, shipping, payment);

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.orders.create,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.stringContaining('items'),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should transform items correctly', async () => {
      const items = [
        {
          product: { id: '1', name: 'Product 1', price: 100 },
          quantity: 2,
        },
      ] as any;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await CheckoutService.submitOrder(items, {} as any, {} as any);

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody.items).toEqual([
        { item_id: '1', quantity: 2 },
      ]);
    });

    it('should throw error on failed submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to submit order' }),
      });

      await expect(
        CheckoutService.submitOrder([], {} as any, {} as any)
      ).rejects.toThrow('Failed to submit order');
    });
  });

  describe('getOrderById', () => {
    it('should fetch order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-123',
        status: 'pending',
        total: 270,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      });

      const result = await CheckoutService.getOrderById('order-1');

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.orders.detail('order-1'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Order not found' }),
      });

      await expect(CheckoutService.getOrderById('invalid')).rejects.toThrow();
    });
  });

  describe('checkoutOrder', () => {
    it('should initiate checkout successfully', async () => {
      const mockCheckout = {
        payment_token: 'payment-token',
        iframe_url: 'https://paymob.com/iframe',
        order_id: 'order-1',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCheckout,
      });

      const result = await CheckoutService.checkoutOrder(
        'order-1',
        'card',
        { first_name: 'John', last_name: 'Doe' }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.orders.checkout('order-1'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.stringContaining('payment_method'),
        })
      );
      expect(result.payment_token).toBe('payment-token');
    });

    it('should include billing data when provided', async () => {
      const billingData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '1234567890',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await CheckoutService.checkoutOrder('order-1', 'card', billingData);

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody.billing_data).toEqual(billingData);
    });
  });
});


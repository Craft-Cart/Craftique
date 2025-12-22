import { PaymentService } from '../../services/payment.service';
import { OrderRepository } from '../../repositories/order.repository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../../config/database';

jest.mock('axios');
jest.mock('../../repositories/order.repository');
jest.mock('../../config/database', () => ({
  prisma: {
    paymobTransaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    paymentService = new PaymentService();
    (paymentService as any).orderRepository = mockOrderRepository;
    jest.clearAllMocks();
  });

  describe('requestPaymentKey', () => {
    it('should request payment key successfully', async () => {
      const orderId = 'order-1';
      const paymentMethod = 'card';
      const mockOrder = {
        id: orderId,
        order_number: 'ORD-123',
        total: { toString: () => '100.00' },
        currency: 'EGP',
        payment_status: 'pending',
      };

      const mockAuthResponse = {
        data: { token: 'auth-token' },
      };

      const mockOrderResponse = {
        data: { id: 12345 },
      };

      const mockPaymentKeyResponse = {
        data: { token: 'payment-token' },
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockedAxios.post
        .mockResolvedValueOnce(mockAuthResponse)
        .mockResolvedValueOnce(mockOrderResponse)
        .mockResolvedValueOnce(mockPaymentKeyResponse);
      mockOrderRepository.update.mockResolvedValue(mockOrder as any);

      const result = await paymentService.requestPaymentKey(orderId, paymentMethod);

      expect(result.payment_token).toBe('payment-token');
      expect(result.order_id).toBe(orderId);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundError when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.requestPaymentKey('order-1', 'card')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when order is not in pending status', async () => {
      const mockOrder = {
        id: 'order-1',
        payment_status: 'paid',
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      await expect(
        paymentService.requestPaymentKey('order-1', 'card')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('handleWebhookCallback', () => {
    it('should process webhook successfully with valid HMAC', async () => {
      const webhookData = {
        obj: {
          id: 12345,
          success: true,
          pending: false,
          amount_cents: 10000,
          order: {
            id: 67890,
            merchant_order_id: 'ORD-123',
          },
          integration_id: 1,
          currency: 'EGP',
          source_data: {
            type: 'card',
            pan: '1234',
            sub_type: 'visa',
          },
        },
      };

      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-123',
        payment_status: 'pending',
      };

      // Generate valid HMAC
      const hmacString = `${webhookData.obj.amount_cents}${webhookData.obj.created_at || ''}${webhookData.obj.currency}${webhookData.obj.error_occured || false}${webhookData.obj.has_parent_transaction || false}${webhookData.obj.id}${webhookData.obj.integration_id}${webhookData.obj.is_3d_secure || false}${webhookData.obj.is_auth || false}${webhookData.obj.is_capture || false}${webhookData.obj.is_refunded || false}${webhookData.obj.is_standalone_payment || false}${webhookData.obj.is_voided || false}${webhookData.obj.order.id}${webhookData.obj.owner || ''}${webhookData.obj.pending}${webhookData.obj.source_data.pan}${webhookData.obj.source_data.sub_type}${webhookData.obj.source_data.type}${webhookData.obj.success}`;
      const hmac = crypto
        .createHmac('sha512', 'test-hmac-secret')
        .update(hmacString)
        .digest('hex');

      mockOrderRepository.findByOrderNumber.mockResolvedValue(mockOrder as any);
      mockedPrisma.paymobTransaction.findUnique.mockResolvedValue(null);
      mockedPrisma.paymobTransaction.create.mockResolvedValue({} as any);
      mockOrderRepository.updatePaymentStatus.mockResolvedValue(mockOrder as any);
      mockOrderRepository.update.mockResolvedValue(mockOrder as any);

      // Mock verifyHMAC to return true
      jest.spyOn(paymentService as any, 'verifyHMAC').mockReturnValue(true);

      const result = await paymentService.handleWebhookCallback(webhookData, hmac);

      expect(result.status).toBe('success');
      expect(mockOrderRepository.updatePaymentStatus).toHaveBeenCalled();
    });

    it('should throw ValidationError when HMAC is invalid', async () => {
      const webhookData = {
        obj: {
          id: 12345,
          order: { merchant_order_id: 'ORD-123' },
        },
      };

      jest.spyOn(paymentService as any, 'verifyHMAC').mockReturnValue(false);

      await expect(
        paymentService.handleWebhookCallback(webhookData, 'invalid-hmac')
      ).rejects.toThrow(ValidationError);
    });

    it('should return success for duplicate webhook', async () => {
      const webhookData = {
        obj: {
          id: 12345,
          order: { merchant_order_id: 'ORD-123' },
        },
      };

      mockedPrisma.paymobTransaction.findUnique.mockResolvedValue({
        id: 12345,
      } as any);

      jest.spyOn(paymentService as any, 'verifyHMAC').mockReturnValue(true);

      const result = await paymentService.handleWebhookCallback(webhookData, 'valid-hmac');

      expect(result.status).toBe('success');
      expect(result.message).toBe('Already processed');
    });
  });
});


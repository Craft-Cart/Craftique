import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';
import { OrderRepository } from '../repositories/order.repository';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PaymentService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  /**
   * Request payment key from Paymob
   */
  async requestPaymentKey(orderId: string, _paymentMethod: string, billingData?: any) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.payment_status !== 'pending') {
      throw new ValidationError('Order is not in pending payment status');
    }

    try {
      // Step 1: Get auth token from Paymob
      const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: config.paymob.apiKey,
      });

      const authToken = authResponse.data.token;

      // Step 2: Create order in Paymob
      const orderResponse = await axios.post(
        'https://accept.paymob.com/api/ecommerce/orders',
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: Math.round(parseFloat(order.total.toString()) * 100), // Convert to cents
          currency: order.currency,
          merchant_order_id: order.order_number,
          items: [],
        }
      );

      const paymobOrderId = orderResponse.data.id.toString();

      // Step 3: Request payment key
      const paymentKeyResponse = await axios.post(
        'https://accept.paymob.com/api/acceptance/payment_keys',
        {
          auth_token: authToken,
          amount_cents: Math.round(parseFloat(order.total.toString()) * 100),
          expiration: 3600,
          order_id: paymobOrderId,
          billing_data: billingData || {
            first_name: 'NA',
            last_name: 'NA',
            email: 'NA',
            phone_number: 'NA',
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            city: 'NA',
            country: 'NA',
            state: 'NA',
            postal_code: 'NA',
          },
          currency: order.currency,
          integration_id: config.paymob.integrationId,
        }
      );

      const paymentToken = paymentKeyResponse.data.token;

      // Update order with Paymob order ID
      await this.orderRepository.update(orderId, {
        paymob_order_id: paymobOrderId,
        paymob_integration_id: config.paymob.integrationId,
      });

      // Generate HMAC for verification
      const hmac = this.generateHMAC(paymobOrderId, paymentToken);

      return {
        payment_token: paymentToken,
        iframe_url: `https://accept.paymob.com/api/acceptance/iframes/${config.paymob.integrationId}?payment_token=${paymentToken}`,
        redirect_url: `${config.apiBaseUrl}/payments/paymob/response`,
        order_id: orderId,
        paymob_order_id: paymobOrderId,
        hmac,
      };
    } catch (error: any) {
      logger.error('Paymob payment key request failed', {
        error: error.message,
        orderId,
        response: error.response?.data,
      });
      throw new ValidationError('Failed to initiate payment');
    }
  }

  /**
   * Verify HMAC signature from Paymob webhook
   */
  verifyHMAC(data: any, receivedHMAC: string): boolean {
    try {
      const hmac = this.generateHMAC(data);
      // Use timing-safe comparison to prevent timing attacks
      if (hmac.length !== receivedHMAC.length) {
        return false;
      }
      return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(receivedHMAC)
      );
    } catch (error) {
      logger.error('HMAC verification error', { error });
      return false;
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateHMAC(orderId?: string, paymentToken?: string, data?: any): string {
    let hmacString = '';

    if (data) {
      // For webhook verification - use available fields
      const obj = data.obj || data;
      const fields = [
        obj.amount_cents,
        obj.created_at || '',
        obj.currency,
        obj.error_occured || false,
        obj.has_parent_transaction || false,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure || false,
        obj.is_auth || false,
        obj.is_capture || false,
        obj.is_refunded || false,
        obj.is_standalone_payment || false,
        obj.is_voided || false,
        obj.order?.id || '',
        obj.owner || '',
        obj.pending,
        obj.source_data?.pan || '',
        obj.source_data?.sub_type || '',
        obj.source_data?.type || '',
        obj.success,
      ];
      hmacString = fields.join('');
    } else if (orderId && paymentToken) {
      // For payment key generation
      hmacString = `${orderId}${paymentToken}`;
    }

    return crypto
      .createHmac('sha512', config.paymob.hmacSecret)
      .update(hmacString)
      .digest('hex');
  }

  /**
   * Handle Paymob webhook callback
   */
  async handleWebhookCallback(webhookData: any, hmac: string) {
    // Verify HMAC
    if (!this.verifyHMAC(webhookData, hmac)) {
      logger.warn('Invalid HMAC signature in webhook', {
        receivedHMAC: hmac,
        webhookData,
      });
      throw new ValidationError('Invalid HMAC signature');
    }

    // Check for duplicate webhook (idempotency)
    const transactionId = webhookData.obj?.id;
    if (transactionId) {
      const existing = await prisma.paymobTransaction.findUnique({
        where: { id: transactionId },
      });

      if (existing) {
        logger.info('Duplicate webhook received, ignoring', { transactionId });
        return { status: 'success', message: 'Already processed' };
      }
    }

    // Extract order information
    const merchantOrderId = webhookData.obj?.order?.merchant_order_id;
    if (!merchantOrderId) {
      throw new ValidationError('Missing merchant order ID in webhook');
    }

    // Find order by order number
    const order = await this.orderRepository.findByOrderNumber(merchantOrderId);
    if (!order) {
      logger.error('Order not found for webhook', { merchantOrderId });
      throw new NotFoundError('Order');
    }

    // Store transaction
    await prisma.paymobTransaction.create({
      data: {
        id: webhookData.obj.id,
        order_id: order.id,
        pending: webhookData.obj.pending,
        amount_cents: webhookData.obj.amount_cents,
        success: webhookData.obj.success,
        is_auth: webhookData.obj.is_auth,
        is_capture: webhookData.obj.is_capture,
        is_standalone_payment: webhookData.obj.is_standalone_payment,
        is_voided: webhookData.obj.is_voided,
        is_refunded: webhookData.obj.is_refunded,
        is_3d_secure: webhookData.obj.is_3d_secure,
        integration_id: webhookData.obj.integration_id,
        profile_id: webhookData.obj.profile_id,
        has_parent_transaction: webhookData.obj.has_parent_transaction,
        currency: webhookData.obj.currency,
        source_data: webhookData.obj.source_data,
        api_source: webhookData.obj.api_source,
        terminal_id: webhookData.obj.terminal_id,
        merchant_commission: webhookData.obj.merchant_commission,
        installment: webhookData.obj.installment,
        discount_details: webhookData.obj.discount_details,
        is_void: webhookData.obj.is_void,
        is_refund: webhookData.obj.is_refund,
        data: webhookData.obj.data,
        is_hidden: webhookData.obj.is_hidden,
        payment_key_claims: webhookData.obj.payment_key_claims,
        error_occured: webhookData.obj.error_occured,
        is_live: webhookData.obj.is_live,
        other_endpoint_reference: webhookData.obj.other_endpoint_reference,
        refunded_amount_cents: webhookData.obj.refunded_amount_cents,
        source_id: webhookData.obj.source_id,
        is_captured: webhookData.obj.is_captured,
        captured_amount: webhookData.obj.captured_amount,
        merchant_staff_tag: webhookData.obj.merchant_staff_tag,
        owner: webhookData.obj.owner,
        parent_transaction: webhookData.obj.parent_transaction,
        hmac,
      },
    });

    // Update order payment status
    let paymentStatus = 'pending';
    if (webhookData.obj.success && !webhookData.obj.pending) {
      paymentStatus = 'paid';
      // Update order status to processing
      await this.orderRepository.update(order.id, {
        status: 'processing',
      });
    } else if (!webhookData.obj.success && !webhookData.obj.pending) {
      paymentStatus = 'failed';
    }

    await this.orderRepository.updatePaymentStatus(
      order.id,
      paymentStatus,
      {
        paymobOrderId: webhookData.obj.order?.id?.toString(),
        paymobTransactionId: webhookData.obj.id,
        paymobIntegrationId: webhookData.obj.integration_id,
      }
    );

    logger.info('Paymob webhook processed successfully', {
      orderId: order.id,
      transactionId: webhookData.obj.id,
      success: webhookData.obj.success,
    });

    return { status: 'success' };
  }
}


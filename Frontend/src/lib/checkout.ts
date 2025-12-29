import { API_ENDPOINTS } from "@/lib/endpoints"
import type { CartItem, ShippingDetails, PaymentDetails, Order } from "@/lib/types"

export class CheckoutService {
  private static getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    }
  }

  static calculateTotals(items: CartItem[]) {
    console.log('[CheckoutService] calculateTotals - Calculating totals for', items.length, 'items');
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shipping = subtotal >= 100 ? 0 : 10
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax

    console.log('[CheckoutService] calculateTotals - Totals:', { subtotal, tax, shipping, total });
    return { subtotal, tax, shipping, total }
  }

  static async submitOrder(items: CartItem[], shipping: ShippingDetails, payment?: PaymentDetails): Promise<Order> {
    console.log('[CheckoutService] submitOrder - Submitting order with', items.length, 'items');
    const orderData = {
      items: items.map((item) => ({
        item_id: item.product.id,
        quantity: item.quantity,
      })),
      shipping_address: {
        street: shipping.address,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.zipCode,
        country: shipping.country,
      },
      billing_address: payment?.billingAddress ? {
        street: payment.billingAddress.address,
        city: payment.billingAddress.city,
        state: payment.billingAddress.state,
        postal_code: payment.billingAddress.zipCode,
        country: payment.billingAddress.country,
      } : undefined,
      notes: shipping.notes,
    }

    const response = await fetch(API_ENDPOINTS.orders.create, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to submit order" }))
      console.error('[CheckoutService] submitOrder - Error:', error);
      throw new Error(error.message || "Failed to submit order")
    }

    const order = await response.json()
    console.log('[CheckoutService] submitOrder - Order created:', order.id);
    return order
  }

  static async getOrderById(orderId: string): Promise<Order> {
    console.log('[CheckoutService] getOrderById - Fetching order:', orderId);
    const url = API_ENDPOINTS.orders.detail(orderId)
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch order" }))
      console.error('[CheckoutService] getOrderById - Error:', error);
      throw new Error(error.message || "Failed to fetch order")
    }

    const order = await response.json()
    console.log('[CheckoutService] getOrderById - Order retrieved:', order.id);
    return order
  }

  static async checkoutOrder(orderId: string, paymentMethod: string, billingData?: any): Promise<any> {
    console.log('[CheckoutService] checkoutOrder - Initiating checkout for order:', orderId, 'with method:', paymentMethod);
    const url = API_ENDPOINTS.orders.checkout(orderId)
    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        payment_method: paymentMethod,
        billing_data: billingData,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to initiate checkout" }))
      console.error('[CheckoutService] checkoutOrder - Error:', error);
      throw new Error(error.message || "Failed to initiate checkout")
    }

    const result = await response.json()
    console.log('[CheckoutService] checkoutOrder - Checkout initiated');
    return result
  }
}

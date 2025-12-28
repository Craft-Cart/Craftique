import { API_ENDPOINTS } from "@/lib/endpoints"
import type { CartItem, ShippingDetails, PaymentDetails, Order } from "@/lib/types"

export class CheckoutService {
  private static getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    }
  }

  static calculateTotals(items: CartItem[]) {
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shipping = subtotal >= 100 ? 0 : 10
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax

    return { subtotal, tax, shipping, total }
  }

  static async submitOrder(items: CartItem[], shipping: ShippingDetails, payment?: PaymentDetails): Promise<Order> {
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
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to submit order" }))
      throw new Error(error.message || "Failed to submit order")
    }

    return response.json()
  }

  static async getOrderById(orderId: string): Promise<Order> {
    const url = API_ENDPOINTS.orders.detail(orderId)
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch order" }))
      throw new Error(error.message || "Failed to fetch order")
    }

    return response.json()
  }

  static async checkoutOrder(orderId: string, paymentMethod: string, billingData?: any): Promise<any> {
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
      throw new Error(error.message || "Failed to initiate checkout")
    }

    return response.json()
  }
}

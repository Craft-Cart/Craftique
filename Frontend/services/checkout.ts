import { API_ENDPOINTS } from "@/lib/endpoints"
import type { CartItem, ShippingDetails, PaymentDetails, Order } from "@/lib/types"

export class CheckoutService {
  static calculateTotals(items: CartItem[]) {
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shipping = subtotal >= 100 ? 0 : 10
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax

    return { subtotal, tax, shipping, total }
  }

  static async submitOrder(items: CartItem[], shipping: ShippingDetails, payment: PaymentDetails): Promise<Order> {
    const orderData = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      shipping,
      payment,
    }

    const response = await fetch(API_ENDPOINTS.orders, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error("Failed to submit order")
    }

    return response.json()
  }

  static async getOrderById(orderId: string): Promise<Order> {
    const url = `${API_ENDPOINTS.orders}/${orderId}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch order")
    }

    return response.json()
  }
}

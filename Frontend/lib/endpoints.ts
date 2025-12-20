/**
 * API endpoint configuration
 * Centralized location for all backend API URLs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

export const API_ENDPOINTS = {
  // Catalog endpoints
  products: `${API_BASE_URL}/products`,
  productDetail: (id: string) => `${API_BASE_URL}/products/${id}`,
  categories: `${API_BASE_URL}/categories`,

  // Checkout endpoints
  checkout: `${API_BASE_URL}/checkout`,
  orders: `${API_BASE_URL}/orders`,
  orderDetail: (id: string) => `${API_BASE_URL}/orders/${id}`,

  // Payment endpoints
  payment: `${API_BASE_URL}/payment`,
  paymentIntent: `${API_BASE_URL}/payment/intent`,
} as const

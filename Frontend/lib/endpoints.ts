/**
 * API endpoint configuration
 * Centralized location for all backend API URLs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    verify: `${API_BASE_URL}/auth/verify`,
    forgotPassword: `${API_BASE_URL}/auth/password/forgot`,
    resetPassword: `${API_BASE_URL}/auth/password/reset`,
  },

  // User endpoints
  users: {
    me: `${API_BASE_URL}/users/me`,
    list: `${API_BASE_URL}/users`,
    detail: (id: string) => `${API_BASE_URL}/users/${id}`,
  },

  // Catalog endpoints
  items: {
    list: `${API_BASE_URL}/items`,
    detail: (id: string) => `${API_BASE_URL}/items/${id}`,
  },
  categories: {
    list: `${API_BASE_URL}/categories`,
    detail: (id: string) => `${API_BASE_URL}/categories/${id}`,
  },

  // Review endpoints
  reviews: {
    byItem: (itemId: string) => `${API_BASE_URL}/items/${itemId}/reviews`,
    create: (itemId: string) => `${API_BASE_URL}/items/${itemId}/reviews`,
    update: (id: string) => `${API_BASE_URL}/reviews/${id}`,
    delete: (id: string) => `${API_BASE_URL}/reviews/${id}`,
    approve: (id: string) => `${API_BASE_URL}/reviews/${id}/approve`,
  },

  // Order endpoints
  orders: {
    list: `${API_BASE_URL}/orders`,
    detail: (id: string) => `${API_BASE_URL}/orders/${id}`,
    create: `${API_BASE_URL}/orders`,
    checkout: (id: string) => `${API_BASE_URL}/orders/${id}/checkout`,
  },

  // Payment endpoints
  payments: {
    paymobCallback: `${API_BASE_URL}/payments/paymob/callback`,
    paymobResponse: `${API_BASE_URL}/payments/paymob/response`,
  },
} as const

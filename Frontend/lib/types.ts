/**
 * Core type definitions for the e-commerce application
 */

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  inStock: boolean
  rating?: number
  reviewCount?: number
}

export interface Category {
  id: string
  name: string
  slug: string
  count: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface FilterParams {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ShippingDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PaymentDetails {
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string
}

export interface Order {
  id: string
  items: CartItem[]
  shipping: ShippingDetails
  subtotal: number
  tax: number
  shipping_cost: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
}

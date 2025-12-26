/**
 * Core type definitions for e-commerce application
 */

// Auth0 User type extensions
export interface Auth0User {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: string;
  updated_at?: string;
  sid?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  auth_time?: number;
}

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

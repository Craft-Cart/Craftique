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

export enum UserRole {
  customer = "customer",
  moderator = "moderator", 
  admin = "admin"
}

export interface User {
  id: string
  auth0_id: string
  email: string
  email_verified: boolean
  name: string
  phone?: string
  address?: Address
  role: UserRole
  permissions: string[]
  last_login?: string
  created_at: string
  updated_at: string
  orders?: Order[]
  reviews?: Review[]
}

export interface Review {
  id: string
  item_id: string
  user_id: string
  rating: number
  title?: string
  comment?: string
  images: string[]
  verified_purchase: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  item?: Product
  user?: User
}

export interface Wishlist {
  id: string
  user_id: string
  item_id: string
  created_at: string
  user?: User
  item?: Product
}

export interface SavedCart {
  id: string
  user_id: string
  items: any
  name: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  user?: User
}

export interface InventoryLog {
  id: string
  item_id: string
  quantity: number
  operation: string
  reason?: string
  user_id: string
  created_at: string
  item?: Product
  user?: User
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  compare_at_price?: number
  sku?: string
  quantity: number
  category_id: string
  images: string[]
  is_active: boolean
  is_featured?: boolean
  weight?: number
  dimensions?: any
  metadata?: any
  created_at: string
  updated_at: string
  category?: Category
  variants?: ProductVariant[]
  average_rating?: number
  review_count?: number
  in_wishlist?: boolean
}

export interface ProductVariant {
  id: string
  item_id: string
  name: string
  sku?: string
  price: number
  quantity: number
  attributes: any
  image_url?: string
  created_at: string
  updated_at: string
  item?: Product
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  parent?: Category
  children?: Category[]
  items_count?: number
}

export interface CartItem {
  product: Product
  quantity: number
  total: number
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

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
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
  notes?: string
}

export interface PaymentDetails {
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string
  billingAddress?: Address
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  shipping_cost?: number
  discount: number
  total: number
  currency: string
  shipping_address: Address
  billing_address?: Address
  payment_method?: PaymentMethod
  payment_status: PaymentStatus
  paymob_order_id?: string
  paymob_transaction_id?: number
  paymob_integration_id?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  name: string
  quantity: number
  price: number
  total: number
  created_at: string
  item?: Product
}

export enum OrderStatus {
  pending = "pending",
  processing = "processing", 
  shipped = "shipped",
  delivered = "delivered",
  cancelled = "cancelled",
  refunded = "refunded"
}

export enum PaymentStatus {
  pending = "pending",
  paid = "paid",
  failed = "failed",
  refunded = "refunded",
  voided = "voided"
}

export enum PaymentMethod {
  card = "card",
  wallet = "wallet",
  cash_on_delivery = "cash_on_delivery",
  kiosk = "kiosk",
  valu = "valu"
}

export interface Address {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

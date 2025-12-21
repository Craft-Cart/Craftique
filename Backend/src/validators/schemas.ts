import { z } from 'zod';

// UUID validation
const uuidSchema = z.string().uuid();

// Pagination schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
});

export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple', 'twitter']),
  redirect_uri: z.string().url().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  role: z.enum(['customer', 'moderator', 'admin']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
}).strict(); // Prevent mass assignment - only allow these fields

export const updateUserAdminSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'moderator', 'admin']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
}).strict();

export const userParamsSchema = z.object({
  user_id: uuidSchema,
});

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['customer', 'moderator', 'admin']).optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parent_id: uuidSchema.optional().nullable(),
  image_url: z.string().url().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
}).strict();

export const categoryParamsSchema = z.object({
  category_id: uuidSchema,
});

export const categoryQuerySchema = z.object({
  parent_id: uuidSchema.optional(),
  is_active: z.coerce.boolean().optional(),
});

// Item schemas
export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  cost: z.coerce.number().positive().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.coerce.number().int().nonnegative().default(0),
  category_id: uuidSchema,
  images: z.array(z.string().url()).default([]),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  weight: z.coerce.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

export const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
}).strict();

export const itemParamsSchema = z.object({
  item_id: uuidSchema,
});

export const itemQuerySchema = paginationQuerySchema.extend({
  category_id: uuidSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'name', 'newest', 'popular']).optional(),
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).default([]),
}).strict();

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
}).strict();

export const reviewParamsSchema = z.object({
  review_id: uuidSchema,
  item_id: uuidSchema,
});

export const reviewQuerySchema = paginationQuerySchema;

// Order schemas
export const orderItemSchema = z.object({
  item_id: uuidSchema,
  quantity: z.coerce.number().int().positive(),
}).strict();

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional(),
  notes: z.string().optional(),
}).strict();

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  notes: z.string().optional(),
}).strict();

export const orderParamsSchema = z.object({
  order_id: uuidSchema,
});

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  user_id: uuidSchema.optional(),
});

// Checkout schemas
export const billingDataSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().min(1),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  street: z.string().min(1),
  building: z.string().optional(),
  city: z.string().min(1),
  country: z.string().min(1),
  state: z.string().optional(),
  postal_code: z.string().min(1),
});

export const checkoutSchema = z.object({
  payment_method: z.enum(['card', 'wallet', 'cash_on_delivery', 'kiosk', 'valu']),
  billing_data: billingDataSchema.optional(),
}).strict();

// Analytics schemas
export const analyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
});

export const exportAnalyticsSchema = z.object({
  report_type: z.enum(['revenue', 'products', 'customers', 'orders']),
  format: z.enum(['csv', 'xlsx', 'pdf']),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
}).strict();


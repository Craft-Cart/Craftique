import { API_ENDPOINTS } from '@/lib/endpoints';

describe('API_ENDPOINTS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default API base URL when NEXT_PUBLIC_API_BASE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const endpoints = require('@/lib/endpoints').API_ENDPOINTS;

    expect(endpoints.auth.login).toContain('localhost:8000');
  });

  it('should use custom API base URL from environment', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/api/v1';
    jest.resetModules();
    const endpoints = require('@/lib/endpoints').API_ENDPOINTS;

    expect(endpoints.auth.login).toContain('api.example.com');
  });

  it('should have all required endpoint categories', () => {
    expect(API_ENDPOINTS.auth).toBeDefined();
    expect(API_ENDPOINTS.users).toBeDefined();
    expect(API_ENDPOINTS.items).toBeDefined();
    expect(API_ENDPOINTS.categories).toBeDefined();
    expect(API_ENDPOINTS.reviews).toBeDefined();
    expect(API_ENDPOINTS.orders).toBeDefined();
    expect(API_ENDPOINTS.payments).toBeDefined();
  });

  it('should generate dynamic endpoints correctly', () => {
    const itemId = 'item-123';
    const orderId = 'order-456';
    const reviewId = 'review-789';

    expect(API_ENDPOINTS.items.detail(itemId)).toContain(itemId);
    expect(API_ENDPOINTS.orders.detail(orderId)).toContain(orderId);
    expect(API_ENDPOINTS.reviews.update(reviewId)).toContain(reviewId);
  });

  it('should have all auth endpoints', () => {
    expect(API_ENDPOINTS.auth.login).toBeDefined();
    expect(API_ENDPOINTS.auth.register).toBeDefined();
    expect(API_ENDPOINTS.auth.logout).toBeDefined();
    expect(API_ENDPOINTS.auth.refresh).toBeDefined();
    expect(API_ENDPOINTS.auth.verify).toBeDefined();
    expect(API_ENDPOINTS.auth.forgotPassword).toBeDefined();
    expect(API_ENDPOINTS.auth.resetPassword).toBeDefined();
  });
});


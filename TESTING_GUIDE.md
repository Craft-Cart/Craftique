# Testing Guide

## Overview

Comprehensive unit tests have been written for both backend and frontend using mocks to isolate components and ensure reliable testing.

## Backend Tests

### Test Structure

Backend tests are located in `Backend/src/__tests__/` and cover:

- **Services** (`services/`): Business logic layer
- **Controllers** (`controllers/`): HTTP request handlers
- **Middleware** (`middleware/`): Authentication, validation, security

### Running Backend Tests

```bash
cd Backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

### Test Coverage

#### Services Tests
- ✅ `user.service.test.ts` - User CRUD operations, validation
- ✅ `auth.service.test.ts` - Authentication, registration, token refresh
- ✅ `order.service.test.ts` - Order creation, validation, cancellation
- ✅ `payment.service.test.ts` - Paymob integration, HMAC verification

#### Controllers Tests
- ✅ `auth.controller.test.ts` - Login, register, logout endpoints

#### Middleware Tests
- ✅ `validation.test.ts` - Zod schema validation, mass assignment prevention
- ✅ `auth.test.ts` - JWT verification, role-based access, ownership checks

### Mocking Strategy

- **Repositories**: Mocked to isolate service layer
- **External APIs**: Auth0 and Paymob API calls are mocked
- **Database**: Prisma client is mocked
- **JWT**: Token verification is mocked

### Example Test

```typescript
describe('UserService', () => {
  it('should return user when found', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockUserRepository.findById.mockResolvedValue(mockUser);
    
    const result = await userService.getUserById('user-1');
    
    expect(result).toEqual(mockUser);
  });
});
```

## Frontend Tests

### Test Structure

Frontend tests are located in `Frontend/src/__tests__/` and cover:

- **Services** (`services/`): API service classes
- **Components** (can be added): React components
- **Utilities** (`lib/`): Helper functions and configurations

### Running Frontend Tests

```bash
cd Frontend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

### Test Coverage

#### Services Tests
- ✅ `catalog.service.test.ts` - Product and category fetching
- ✅ `checkout.service.test.ts` - Order submission, checkout flow

#### Utilities Tests
- ✅ `endpoints.test.ts` - API endpoint configuration

### Mocking Strategy

- **Fetch API**: Global fetch is mocked
- **Next.js Router**: Navigation hooks are mocked
- **Environment Variables**: Test-specific env vars

### Example Test

```typescript
describe('CatalogService', () => {
  it('should fetch products successfully', async () => {
    const mockProducts = { items: [], total: 0 };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });
    
    const result = await CatalogService.getProducts();
    
    expect(result).toEqual(mockProducts);
  });
});
```

## Test Best Practices

### 1. Isolation
- Each test is independent
- Mocks are reset between tests
- No shared state between tests

### 2. Coverage
- Test happy paths
- Test error cases
- Test edge cases
- Test validation failures

### 3. Naming
- Descriptive test names
- Group related tests with `describe` blocks
- Use `it` for individual test cases

### 4. Assertions
- Use specific assertions
- Test both success and failure cases
- Verify mock calls and parameters

## Security Testing

### Backend Security Tests

1. **Mass Assignment Prevention**
   - Tests verify Zod rejects unknown properties
   - Tests ensure only allowed fields are updated

2. **Authentication Tests**
   - JWT verification
   - Role-based access control
   - Ownership checks

3. **Validation Tests**
   - Input type validation
   - Required field validation
   - Format validation (email, UUID, etc.)

### Frontend Security Tests

1. **API Integration**
   - Credentials included in requests
   - Proper error handling
   - No sensitive data in requests

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Backend Tests
  run: |
    cd Backend
    npm test -- --coverage

- name: Run Frontend Tests
  run: |
    cd Frontend
    npm test -- --coverage
```

## Coverage Goals

- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 70%+ coverage
- **Critical paths**: 100% coverage (auth, payments, orders)

## Adding New Tests

When adding new features:

1. Write tests first (TDD approach)
2. Test all code paths
3. Mock external dependencies
4. Test error cases
5. Update this guide

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are reset in `beforeEach`
2. **Async issues**: Use `async/await` properly
3. **Type errors**: Check TypeScript types in test files
4. **Import errors**: Verify module paths and aliases

## Next Steps

- Add integration tests
- Add E2E tests with Playwright/Cypress
- Add performance tests
- Add security penetration tests


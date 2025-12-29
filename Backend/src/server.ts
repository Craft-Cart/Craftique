import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { setupSecurityMiddleware } from './middleware/security';
import { errorHandler } from './utils/errors';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import itemRoutes from './routes/item.routes';
import reviewRoutes from './routes/review.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import moderatorRoutes from './routes/moderator.routes';
import adminRoutes from './routes/admin.routes';
import wishlistRoutes from './routes/wishlist.routes';
import notificationRoutes from './routes/notification.routes';
import inventoryRoutes from './routes/inventory.routes';

const app: Express = express();

console.log('[Server] Initializing Express application');

// Trust proxy (for Cloudflare, load balancers)
app.set('trust proxy', 1);

// Serve static files (images, etc.)
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

console.log('[Server] Static file directories configured');

// Body parsing middleware
// Note: Paymob webhook needs raw body for HMAC verification
// We'll handle that route separately
app.use(express.json({ limit: '10kb' })); // Prevent large payload abuse
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

console.log('[Server] Body parsing middleware configured');

// Cookie parser
app.use(cookieParser());

console.log('[Server] Cookie parser configured');

// Security middleware
setupSecurityMiddleware(app);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
console.log('[Server] Registering API routes');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/moderators', moderatorRoutes);
app.use('/api/v1/admins', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

console.log('[Server] All API routes registered');

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

console.log(`[Server] Starting server on port ${PORT} in ${config.nodeEnv} mode`);
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: config.nodeEnv,
    apiBaseUrl: config.apiBaseUrl,
  });
  console.log('[Server] Server successfully started and listening');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;


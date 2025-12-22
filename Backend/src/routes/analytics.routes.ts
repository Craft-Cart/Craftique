import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  analyticsQuerySchema,
  exportAnalyticsSchema,
} from '../validators/schemas';

const router = Router();
const analyticsController = new AnalyticsController();

// All routes require admin role
router.use(verifyJWT);
router.use(requireRole('admin'));

router.get(
  '/dashboard',
  validateQuery(analyticsQuerySchema),
  analyticsController.getDashboard
);
router.get(
  '/revenue',
  validateQuery(analyticsQuerySchema),
  analyticsController.getRevenue
);
router.get('/products', analyticsController.getProducts);
router.get('/customers', analyticsController.getCustomers);
router.post(
  '/export',
  validateBody(exportAnalyticsSchema),
  analyticsController.export
);

export default router;


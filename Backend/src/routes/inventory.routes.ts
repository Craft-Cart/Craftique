import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication
router.use(verifyJWT);

// Admin/manager only for adjustments
router.post('/adjust', requireRole('admin', 'moderator'), validateBody, inventoryController.adjustInventory);
router.post('/bulk-update', requireRole('admin', 'moderator'), validateBody, inventoryController.bulkUpdateInventory);

// View-only for regular users
router.get('/logs', inventoryController.getInventoryLogs);
router.get('/low-stock', requireRole('admin', 'moderator'), inventoryController.getLowStockItems);

export default router;
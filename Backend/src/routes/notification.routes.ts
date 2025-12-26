import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { verifyJWT } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(verifyJWT);

router.get('/', notificationController.getNotifications);
router.put('/:notification_id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:notification_id', notificationController.deleteNotification);

export default router;
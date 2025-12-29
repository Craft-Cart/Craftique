import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { verifyJWT } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { markAsReadSchema, markAllAsReadSchema, notificationParamsSchema } from '../validators/schemas';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(verifyJWT);

router.get('/', notificationController.getNotifications);
router.put('/:notification_id/read', validateParams(notificationParamsSchema), validateBody(markAsReadSchema), notificationController.markAsRead);
router.put('/read-all', validateBody(markAllAsReadSchema), notificationController.markAllAsRead);
router.delete('/:notification_id', validateParams(notificationParamsSchema), notificationController.deleteNotification);

export default router;
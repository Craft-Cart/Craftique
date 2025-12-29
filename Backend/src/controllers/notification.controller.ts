import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[NotificationController] getNotifications - Request received');
      const userId = req.user?.id;
      const { page = 1, limit = 20, unread_only = false } = req.query;
      console.log('[NotificationController] getNotifications - Query params:', { userId, page, limit, unread_only });

      if (!userId) {
        console.log('[NotificationController] getNotifications - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notifications = await this.notificationService.getNotifications(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unread_only === 'true',
      });
      console.log('[NotificationController] getNotifications - Retrieved', notifications.length, 'notifications');
      res.json(notifications);
    } catch (error) {
      console.error('[NotificationController] getNotifications - Error:', error);
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[NotificationController] markAsRead - Request received');
      const userId = req.user?.id;
      const { notification_id } = req.params;
      console.log('[NotificationController] markAsRead - Marking notification as read:', notification_id);

      if (!userId) {
        console.log('[NotificationController] markAsRead - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAsRead(userId, notification_id);
      console.log('[NotificationController] markAsRead - Notification marked as read');
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('[NotificationController] markAsRead - Error:', error);
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[NotificationController] markAllAsRead - Request received');
      const userId = req.user?.id;

      if (!userId) {
        console.log('[NotificationController] markAllAsRead - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAllAsRead(userId);
      console.log('[NotificationController] markAllAsRead - All notifications marked as read');
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('[NotificationController] markAllAsRead - Error:', error);
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[NotificationController] deleteNotification - Request received');
      const userId = req.user?.id;
      const { notification_id } = req.params;
      console.log('[NotificationController] deleteNotification - Deleting notification:', notification_id);

      if (!userId) {
        console.log('[NotificationController] deleteNotification - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.deleteNotification(userId, notification_id);
      console.log('[NotificationController] deleteNotification - Notification deleted');
      res.status(204).send();
    } catch (error) {
      console.error('[NotificationController] deleteNotification - Error:', error);
      next(error);
    }
  };
}
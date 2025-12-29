import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, unread_only = false } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notifications = await this.notificationService.getNotifications(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unread_only === 'true',
      });
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { notification_id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAsRead(userId, notification_id);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { notification_id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.notificationService.deleteNotification(userId, notification_id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
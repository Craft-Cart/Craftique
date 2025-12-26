import { PrismaClient } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class NotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (unreadOnly) {
      where.is_read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount: await this.getUnreadCount(userId),
    };
  }

  async createNotification(userId: string, data: {
    title: string;
    message: string;
    type: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        user_id: userId,
        ...data,
      },
    });

    logger.info('Notification created', {
      userId,
      notificationId: notification.id,
      type: data.type,
    });

    return notification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });

    logger.info('Notification marked as read', {
      userId,
      notificationId,
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    logger.info('All notifications marked as read', { userId });
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info('Notification deleted', {
      userId,
      notificationId,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  // Create notifications for common events
  async createOrderStatusNotification(userId: string, orderNumber: string, status: string) {
    const statusMessages = {
      processing: 'Your order is being processed',
      shipped: `Your order ${orderNumber} has been shipped`,
      delivered: `Your order ${orderNumber} has been delivered`,
      cancelled: 'Your order has been cancelled',
    };

    return this.createNotification(userId, {
      title: `Order Status Update`,
      message: statusMessages[status as keyof typeof statusMessages] || `Order ${orderNumber} status: ${status}`,
      type: 'order',
    });
  }

  async createPromotionNotification(userId: string, title: string, message: string) {
    return this.createNotification(userId, {
      title,
      message,
      type: 'promotion',
    });
  }

  async createSystemNotification(userId: string, title: string, message: string) {
    return this.createNotification(userId, {
      title,
      message,
      type: 'system',
    });
  }
}
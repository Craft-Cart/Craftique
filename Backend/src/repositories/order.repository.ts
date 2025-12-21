import { PrismaClient, Order, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order_items: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { order_number: orderNumber },
    });
  }

  async findMany(options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: OrderStatus;
  }): Promise<{ orders: Order[]; total: number }> {
    const { page = 1, limit = 20, userId, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    
    if (userId) {
      where.user_id = userId;
    }
    
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          order_items: {
            include: {
              item: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order_items: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order_items: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.order.delete({
      where: { id },
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string, paymobData?: {
    paymobOrderId?: string;
    paymobTransactionId?: number;
    paymobIntegrationId?: number;
  }): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        payment_status: paymentStatus as any,
        ...paymobData,
      },
    });
  }

  async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }
}


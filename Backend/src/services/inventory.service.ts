import { PrismaClient } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class InventoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getInventoryLogs(options: {
    itemId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { itemId, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (itemId) {
      where.item_id = itemId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          item: {
            include: { category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustInventory(userId: string, data: {
    itemId: string;
    quantity: number;
    operation: 'in' | 'out' | 'adjustment';
    reason?: string;
  }) {
    const { itemId, quantity, operation, reason } = data;

    // Get current item
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    switch (operation) {
      case 'in':
        newQuantity += quantity;
        break;
      case 'out':
        newQuantity -= quantity;
        if (newQuantity < 0) {
          throw new Error('Insufficient inventory');
        }
        break;
      case 'adjustment':
        newQuantity = quantity;
        break;
    }

    // Update item quantity
    await this.prisma.item.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });

    // Create inventory log
    const log = await this.prisma.inventoryLog.create({
      data: {
        item_id: itemId,
        quantity,
        operation,
        reason: reason || this.getDefaultReason(operation),
        user_id: userId,
      },
      include: {
        item: {
          include: { category: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info('Inventory adjusted', {
      userId,
      itemId,
      operation,
      quantity,
      previousQuantity: item.quantity,
      newQuantity,
      reason,
    });

    return log;
  }

  async bulkUpdateInventory(userId: string, updates: Array<{
    itemId: string;
    quantity: number;
    operation: 'in' | 'out' | 'adjustment';
    reason?: string;
  }>) {
    const results = await Promise.all(
      updates.map((update) => 
        this.adjustInventory(userId, update).catch((error) => ({
          error: error.message,
          itemId: update.itemId,
        }))
      )
    );

    return {
      results,
      successCount: results.filter((r: any) => !r.error).length,
      errorCount: results.filter((r: any) => r.error).length,
    };
  }

  async getLowStockItems(threshold: number = 10) {
    const items = await this.prisma.item.findMany({
      where: {
        is_active: true,
        quantity: { lte: threshold },
      },
      include: {
        category: true,
      },
      orderBy: { quantity: 'asc' },
    });

    return items.map(item => ({
      ...item,
      low_stock: item.quantity <= threshold,
    }));
  }

  async getInventoryReport() {
    const [totalItems, lowStockCount, outOfStockCount, aggregateResult] = await Promise.all([
      this.prisma.item.count({
        where: { is_active: true },
      }),
      this.prisma.item.count({
        where: {
          is_active: true,
          quantity: { lte: 10, gt: 0 },
        },
      }),
      this.prisma.item.count({
        where: {
          is_active: true,
          quantity: { lte: 0 },
        },
      }),
      this.prisma.item.aggregate({
        where: { is_active: true },
        _sum: {
          quantity: true,
          price: true,
        },
      }),
    ]);

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalQuantity: aggregateResult._sum.quantity || 0,
      totalValue: 0, // Would need to calculate price * quantity
    };
  }

  private getDefaultReason(operation: string): string {
    const reasons = {
      in: 'Stock received',
      out: 'Sale',
      adjustment: 'Inventory adjustment',
    };
    return reasons[operation as keyof typeof reasons] || 'Unknown';
  }
}
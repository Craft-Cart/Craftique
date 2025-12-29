import { prisma } from '../config/database';

export class AnalyticsService {
  async getDashboard(period: string = 'monthly', dateFrom?: string, dateTo?: string) {
    const dateFilter = this.getDateFilter(period, dateFrom, dateTo);

    const [totalRevenue, totalOrders, totalCustomers, averageOrderValue] = await Promise.all([
      this.getTotalRevenue(dateFilter),
      this.getTotalOrders(dateFilter),
      this.getTotalCustomers(dateFilter),
      this.getAverageOrderValue(dateFilter),
    ]);

    const result = {
      period,
      date_from: dateFilter.from,
      date_to: dateFilter.to,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      total_customers: totalCustomers,
      average_order_value: averageOrderValue,
      top_products: await this.getTopProducts(dateFilter),
      revenue_by_category: await this.getRevenueByCategory(dateFilter),
    };
    return result;
  }

  async getRevenue(period: string, dateFrom?: string, dateTo?: string) {
    const dateFilter = this.getDateFilter(period, dateFrom, dateTo);
    const totalRevenue = await this.getTotalRevenue(dateFilter);
    const revenueByPeriod = await this.getRevenueByPeriod(period, dateFilter);

    const result = {
      total_revenue: totalRevenue,
      revenue_by_period: revenueByPeriod,
    };
    return result;
  }

  async getProductAnalytics() {
    const [topSelling, lowStock] = await Promise.all([
      this.getTopSellingProducts(),
      this.getLowStockProducts(),
    ]);

    const result = {
      top_selling: topSelling,
      low_stock: lowStock,
    };
    return result;
  }

  async getCustomerAnalytics() {
    const [totalCustomers, newCustomers, repeatCustomers, customerLifetimeValue] = await Promise.all([
      prisma.user.count({ where: { role: 'customer' } }),
      this.getNewCustomers(),
      this.getRepeatCustomers(),
      this.getCustomerLifetimeValue(),
    ]);

    const result = {
      total_customers: totalCustomers,
      new_customers: newCustomers,
      repeat_customers: repeatCustomers,
      customer_lifetime_value: customerLifetimeValue,
    };
    return result;
  }

  async exportData(reportType: string, _format: string, dateFrom?: string, dateTo?: string) {
    const dateFilter = this.getDateFilter('monthly', dateFrom, dateTo);

    let data: any;
    switch (reportType) {
      case 'revenue':
        data = await this.getRevenue('monthly', dateFrom, dateTo);
        break;
      case 'products':
        data = await this.getProductAnalytics();
        break;
      case 'customers':
        data = await this.getCustomerAnalytics();
        break;
      case 'orders':
        data = await this.getOrdersData(dateFilter);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return JSON.stringify(data, null, 2);
  }

  private getDateFilter(period: string, dateFrom?: string, dateTo?: string) {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    if (dateFrom && dateTo) {
      from = new Date(dateFrom);
      to = new Date(dateTo);
    } else {
      switch (period) {
        case 'daily':
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          from = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          from = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'yearly':
          from = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          from = new Date(now.setMonth(now.getMonth() - 1));
      }
    }

    return { from, to };
  }

  private async getTotalRevenue(filter: { from: Date; to: Date }) {
    const result = await prisma.order.aggregate({
      where: {
        payment_status: 'paid',
        created_at: {
          gte: filter.from,
          lte: filter.to,
        },
      },
      _sum: {
        total: true,
      },
    });
    return Number(result._sum.total || 0);
  }

  private async getTotalOrders(filter: { from: Date; to: Date }) {
    return prisma.order.count({
      where: {
        created_at: {
          gte: filter.from,
          lte: filter.to,
        },
      },
    });
  }

  private async getTotalCustomers(filter: { from: Date; to: Date }) {
    return prisma.user.count({
      where: {
        role: 'customer',
        created_at: {
          gte: filter.from,
          lte: filter.to,
        },
      },
    });
  }

  private async getAverageOrderValue(filter: { from: Date; to: Date }) {
    const result = await prisma.order.aggregate({
      where: {
        created_at: {
          gte: filter.from,
          lte: filter.to,
        },
      },
      _avg: {
        total: true,
      },
    });
    return Number(result._avg.total || 0);
  }

  private async getTopProducts(filter: { from: Date; to: Date }) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          created_at: {
            gte: filter.from,
            lte: filter.to,
          },
        },
      },
      include: {
        item: true,
      },
    });

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

    orderItems.forEach((oi) => {
      const itemId = oi.item_id;
      const existing = productSales.get(itemId) || { name: oi.name, quantity: 0, revenue: 0 };
      existing.quantity += oi.quantity;
      existing.revenue += Number(oi.total);
      productSales.set(itemId, existing);
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async getRevenueByCategory(filter: { from: Date; to: Date }) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          created_at: {
            gte: filter.from,
            lte: filter.to,
          },
        },
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    const categoryRevenue = new Map<string, number>();

    orderItems.forEach((oi) => {
      const categoryName = oi.item.category.name;
      const existing = categoryRevenue.get(categoryName) || 0;
      categoryRevenue.set(categoryName, existing + Number(oi.total));
    });

    return Array.from(categoryRevenue.entries()).map(([name, revenue]) => ({ name, revenue }));
  }

  private async getRevenueByPeriod(_period: string, _filter: { from: Date; to: Date }) {
    // Simplified - in production, group by period
    return [];
  }

  private async getTopSellingProducts() {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['item_id'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const itemIds = orderItems.map((oi) => oi.item_id);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
    });

    return orderItems.map((oi) => {
      const item = items.find((i) => i.id === oi.item_id);
      return {
        item_id: oi.item_id,
        name: item?.name || 'Unknown',
        total_quantity: oi._sum.quantity,
      };
    });
  }

  private async getLowStockProducts() {
    return prisma.item.findMany({
      where: {
        quantity: {
          lte: 10,
        },
        is_active: true,
      },
      orderBy: {
        quantity: 'asc',
      },
      take: 20,
    });
  }

  private async getNewCustomers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return prisma.user.count({
      where: {
        role: 'customer',
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });
  }

  private async getRepeatCustomers() {
    const customersWithMultipleOrders = await prisma.order.groupBy({
      by: ['user_id'],
      having: {
        user_id: {
          _count: {
            gt: 1,
          },
        },
      },
    });
    return customersWithMultipleOrders.length;
  }

  private async getCustomerLifetimeValue() {
    const result = await prisma.order.aggregate({
      where: {
        payment_status: 'paid',
      },
      _avg: {
        total: true,
      },
    });
    return Number(result._avg.total || 0);
  }

  private async getOrdersData(filter: { from: Date; to: Date }) {
    return prisma.order.findMany({
      where: {
        created_at: {
          gte: filter.from,
          lte: filter.to,
        },
      },
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
}


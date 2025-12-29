import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AnalyticsController] getDashboard - Request received');
      const { period, date_from, date_to } = req.query;
      console.log('[AnalyticsController] getDashboard - Query params:', { period, date_from, date_to });
      const result = await this.analyticsService.getDashboard(
        (period as string) || 'monthly',
        date_from as string,
        date_to as string
      );
      console.log('[AnalyticsController] getDashboard - Dashboard data retrieved successfully');
      res.json(result);
    } catch (error) {
      console.error('[AnalyticsController] getDashboard - Error:', error);
      next(error);
    }
  };

  getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AnalyticsController] getRevenue - Request received');
      const { period, date_from, date_to } = req.query;
      console.log('[AnalyticsController] getRevenue - Query params:', { period, date_from, date_to });
      const result = await this.analyticsService.getRevenue(
        period as string,
        date_from as string,
        date_to as string
      );
      console.log('[AnalyticsController] getRevenue - Revenue data retrieved successfully');
      res.json(result);
    } catch (error) {
      console.error('[AnalyticsController] getRevenue - Error:', error);
      next(error);
    }
  };

  getProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AnalyticsController] getProducts - Request received');
      const result = await this.analyticsService.getProductAnalytics();
      console.log('[AnalyticsController] getProducts - Product analytics retrieved successfully');
      res.json(result);
    } catch (error) {
      console.error('[AnalyticsController] getProducts - Error:', error);
      next(error);
    }
  };

  getCustomers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AnalyticsController] getCustomers - Request received');
      const result = await this.analyticsService.getCustomerAnalytics();
      console.log('[AnalyticsController] getCustomers - Customer analytics retrieved successfully');
      res.json(result);
    } catch (error) {
      console.error('[AnalyticsController] getCustomers - Error:', error);
      next(error);
    }
  };

  export = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AnalyticsController] export - Request received');
      const { report_type, format, date_from, date_to } = req.body;
      console.log('[AnalyticsController] export - Export params:', { report_type, format, date_from, date_to });
      const data = await this.analyticsService.exportData(
        report_type,
        format,
        date_from,
        date_to
      );
      console.log('[AnalyticsController] export - Data exported successfully');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${report_type}_${Date.now()}.${format}`);
      res.send(data);
    } catch (error) {
      console.error('[AnalyticsController] export - Error:', error);
      next(error);
    }
  };
}


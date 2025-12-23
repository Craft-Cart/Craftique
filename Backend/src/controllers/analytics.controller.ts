import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period, date_from, date_to } = req.query;
      const result = await this.analyticsService.getDashboard(
        (period as string) || 'monthly',
        date_from as string,
        date_to as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period, date_from, date_to } = req.query;
      const result = await this.analyticsService.getRevenue(
        period as string,
        date_from as string,
        date_to as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.analyticsService.getProductAnalytics();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getCustomers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.analyticsService.getCustomerAnalytics();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  export = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { report_type, format, date_from, date_to } = req.body;
      const data = await this.analyticsService.exportData(
        report_type,
        format,
        date_from,
        date_to
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${report_type}_${Date.now()}.${format}`);
      res.send(data);
    } catch (error) {
      next(error);
    }
  };
}


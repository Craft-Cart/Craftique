import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getInventoryLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item_id, page = 1, limit = 50 } = req.query;
      
      const logs = await this.inventoryService.getInventoryLogs({
        itemId: item_id as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(logs);
    } catch (error) {
      next(error);
    }
  };

  adjustInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { item_id, quantity, operation, reason } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const log = await this.inventoryService.adjustInventory(userId, {
        itemId: item_id,
        quantity,
        operation, // 'in', 'out', 'adjustment'
        reason,
      });

      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { updates } = req.body; // Array of { item_id, quantity }

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const results = await this.inventoryService.bulkUpdateInventory(userId, updates);

      res.json(results);
    } catch (error) {
      next(error);
    }
  };

  getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { threshold = 10 } = req.query;
      
      const items = await this.inventoryService.getLowStockItems(parseInt(threshold as string));

      res.json(items);
    } catch (error) {
      next(error);
    }
  };
}
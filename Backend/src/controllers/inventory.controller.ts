import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getInventoryLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[InventoryController] getInventoryLogs - Request received');
      const { item_id, page = 1, limit = 50 } = req.query;
      console.log('[InventoryController] getInventoryLogs - Query params:', { item_id, page, limit });
      const logs = await this.inventoryService.getInventoryLogs({
        itemId: item_id as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      console.log('[InventoryController] getInventoryLogs - Retrieved logs:', logs.logs?.length || 0);
      res.json(logs);
    } catch (error) {
      console.error('[InventoryController] getInventoryLogs - Error:', error);
      next(error);
    }
  };

  adjustInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[InventoryController] adjustInventory - Request received');
      const userId = req.user?.id;
      const { item_id, quantity, operation, reason } = req.body;
      console.log('[InventoryController] adjustInventory - Adjusting inventory for item:', item_id, 'operation:', operation);

      if (!userId) {
        console.log('[InventoryController] adjustInventory - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const log = await this.inventoryService.adjustInventory(userId, {
        itemId: item_id,
        quantity,
        operation,
        reason,
      });
      console.log('[InventoryController] adjustInventory - Inventory adjusted successfully');
      res.status(201).json(log);
    } catch (error) {
      console.error('[InventoryController] adjustInventory - Error:', error);
      next(error);
    }
  };

  bulkUpdateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[InventoryController] bulkUpdateInventory - Request received');
      const userId = req.user?.id;
      const { updates } = req.body;
      console.log('[InventoryController] bulkUpdateInventory - Bulk updating', updates.length, 'items');

      if (!userId) {
        console.log('[InventoryController] bulkUpdateInventory - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const results = await this.inventoryService.bulkUpdateInventory(userId, updates);
      console.log('[InventoryController] bulkUpdateInventory - Bulk update completed');
      res.json(results);
    } catch (error) {
      console.error('[InventoryController] bulkUpdateInventory - Error:', error);
      next(error);
    }
  };

  getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[InventoryController] getLowStockItems - Request received');
      const { threshold = 10 } = req.query;
      console.log('[InventoryController] getLowStockItems - Threshold:', threshold);
      const items = await this.inventoryService.getLowStockItems(parseInt(threshold as string));
      console.log('[InventoryController] getLowStockItems - Retrieved', items.length, 'low stock items');
      res.json(items);
    } catch (error) {
      console.error('[InventoryController] getLowStockItems - Error:', error);
      next(error);
    }
  };
}
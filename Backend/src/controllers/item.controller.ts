import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/item.service';

export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  getItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ItemController] getItems - Request received');
      const { page, limit, category_id, is_active, is_featured, search, sort_by } = req.query;
      console.log('[ItemController] getItems - Query params:', { page, limit, category_id, is_active, is_featured, search, sort_by });
      const result = await this.itemService.getItems({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        categoryId: category_id as string,
        isActive: is_active ? (is_active === 'true') : undefined,
        isFeatured: is_featured ? (is_featured === 'true') : undefined,
        search: search as string,
        sortBy: sort_by as string,
      });
      console.log('[ItemController] getItems - Retrieved', result.items?.length || 0, 'items');
      res.json(result);
    } catch (error) {
      console.error('[ItemController] getItems - Error:', error);
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ItemController] getItemById - Request received');
      const { item_id } = req.params;
      console.log('[ItemController] getItemById - Fetching item with ID:', item_id);
      const item = await this.itemService.getItemById(item_id);
      console.log('[ItemController] getItemById - Item retrieved:', item.name);
      res.json(item);
    } catch (error) {
      console.error('[ItemController] getItemById - Error:', error);
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ItemController] createItem - Request received');
      console.log('[ItemController] createItem - Creating item:', req.body.name);
      const item = await this.itemService.createItem(req.body);
      console.log('[ItemController] createItem - Item created with ID:', item.id);
      res.status(201).json(item);
    } catch (error) {
      console.error('[ItemController] createItem - Error:', error);
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ItemController] updateItem - Request received');
      const { item_id } = req.params;
      console.log('[ItemController] updateItem - Updating item:', item_id);
      const item = await this.itemService.updateItem(item_id, req.body);
      console.log('[ItemController] updateItem - Item updated:', item.name);
      res.json(item);
    } catch (error) {
      console.error('[ItemController] updateItem - Error:', error);
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[ItemController] deleteItem - Request received');
      const { item_id } = req.params;
      console.log('[ItemController] deleteItem - Deleting item:', item_id);
      await this.itemService.deleteItem(item_id);
      console.log('[ItemController] deleteItem - Item deleted successfully');
      res.status(204).send();
    } catch (error) {
      console.error('[ItemController] deleteItem - Error:', error);
      next(error);
    }
  };
}


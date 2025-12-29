import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/item.service';

export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  getItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, category_id, is_active, is_featured, search, sort_by } = req.query;
      const result = await this.itemService.getItems({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        categoryId: category_id as string,
        isActive: is_active ? (is_active === 'true') : undefined,
        isFeatured: is_featured ? (is_featured === 'true') : undefined,
        search: search as string,
        sortBy: sort_by as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item_id } = req.params;
      const item = await this.itemService.getItemById(item_id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.itemService.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item_id } = req.params;
      const item = await this.itemService.updateItem(item_id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item_id } = req.params;
      await this.itemService.deleteItem(item_id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}


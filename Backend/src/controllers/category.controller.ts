import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { parent_id, is_active } = req.query;
      const categories = await this.categoryService.getCategories({
        parentId: parent_id as string | undefined,
        isActive: is_active ? (is_active === 'true') : undefined,
      });
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_id } = req.params;
      const category = await this.categoryService.getCategoryById(category_id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, parent_id, image_url } = req.body;
      const category = await this.categoryService.createCategory({
        name,
        description,
        parentId: parent_id,
        imageUrl: image_url,
      });
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_id } = req.params;
      const { name, description, is_active } = req.body;
      const category = await this.categoryService.updateCategory(category_id, {
        name,
        description,
        isActive: is_active,
      });
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_id } = req.params;
      await this.categoryService.deleteCategory(category_id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}


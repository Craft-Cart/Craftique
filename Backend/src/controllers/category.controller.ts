import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[CategoryController] getCategories - Request received');
      const { parent_id, is_active } = req.query;
      console.log('[CategoryController] getCategories - Query params:', { parent_id, is_active });
      const categories = await this.categoryService.getCategories({
        parentId: parent_id as string | undefined,
        isActive: is_active ? (is_active === 'true') : undefined,
      });
      console.log('[CategoryController] getCategories - Retrieved', categories.length, 'categories');
      res.json(categories);
    } catch (error) {
      console.error('[CategoryController] getCategories - Error:', error);
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[CategoryController] getCategoryById - Request received');
      const { category_id } = req.params;
      console.log('[CategoryController] getCategoryById - Fetching category with ID:', category_id);
      const category = await this.categoryService.getCategoryById(category_id);
      console.log('[CategoryController] getCategoryById - Category retrieved:', category.name);
      res.json(category);
    } catch (error) {
      console.error('[CategoryController] getCategoryById - Error:', error);
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[CategoryController] createCategory - Request received');
      const { name, description, parent_id, image_url } = req.body;
      console.log('[CategoryController] createCategory - Creating category:', name);
      const category = await this.categoryService.createCategory({
        name,
        description,
        parentId: parent_id,
        imageUrl: image_url,
      });
      console.log('[CategoryController] createCategory - Category created with ID:', category.id);
      res.status(201).json(category);
    } catch (error) {
      console.error('[CategoryController] createCategory - Error:', error);
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[CategoryController] updateCategory - Request received');
      const { category_id } = req.params;
      const { name, description, is_active } = req.body;
      console.log('[CategoryController] updateCategory - Updating category:', category_id);
      const category = await this.categoryService.updateCategory(category_id, {
        name,
        description,
        isActive: is_active,
      });
      console.log('[CategoryController] updateCategory - Category updated:', category.name);
      res.json(category);
    } catch (error) {
      console.error('[CategoryController] updateCategory - Error:', error);
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[CategoryController] deleteCategory - Request received');
      const { category_id } = req.params;
      console.log('[CategoryController] deleteCategory - Deleting category:', category_id);
      await this.categoryService.deleteCategory(category_id);
      console.log('[CategoryController] deleteCategory - Category deleted successfully');
      res.status(204).send();
    } catch (error) {
      console.error('[CategoryController] deleteCategory - Error:', error);
      next(error);
    }
  };
}


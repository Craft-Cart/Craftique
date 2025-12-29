import { CategoryRepository } from '../repositories/category.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { slugify } from '../utils/helpers';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategoryById(id: string) {
    console.log('[CategoryService] getCategoryById - Fetching category:', id);
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      console.log('[CategoryService] getCategoryById - Category not found');
      throw new NotFoundError('Category');
    }
    console.log('[CategoryService] getCategoryById - Category retrieved:', category.name);
    return category;
  }

  async getCategories(options: {
    parentId?: string | null;
    isActive?: boolean;
  }) {
    console.log('[CategoryService] getCategories - Fetching categories with options:', options);
    const categories = this.categoryRepository.findMany(options);
    console.log('[CategoryService] getCategories - Categories retrieved');
    return categories;
  }

  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string | null;
    imageUrl?: string;
  }) {
    console.log('[CategoryService] createCategory - Creating category:', data.name);
    const slug = slugify(data.name);

    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) {
      console.log('[CategoryService] createCategory - Category already exists');
      throw new ConflictError('Category with this name already exists');
    }

    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        console.log('[CategoryService] createCategory - Parent category not found');
        throw new NotFoundError('Parent category');
      }
    }

    const category = this.categoryRepository.create({
      name: data.name,
      slug,
      description: data.description,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      image_url: data.imageUrl,
      is_active: true,
    });
    console.log('[CategoryService] createCategory - Category created');
    return category;
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    console.log('[CategoryService] updateCategory - Updating category:', id);
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      console.log('[CategoryService] updateCategory - Category not found');
      throw new NotFoundError('Category');
    }

    const updateData: any = {
      description: data.description,
      is_active: data.isActive,
    };

    if (data.name && data.name !== category.name) {
      const slug = slugify(data.name);
      const existing = await this.categoryRepository.findBySlug(slug);
      if (existing && existing.id !== id) {
        console.log('[CategoryService] updateCategory - Category with this name already exists');
        throw new ConflictError('Category with this name already exists');
      }
      updateData.name = data.name;
      updateData.slug = slug;
    }

    const updatedCategory = this.categoryRepository.update(id, updateData);
    console.log('[CategoryService] updateCategory - Category updated');
    return updatedCategory;
  }

  async deleteCategory(id: string) {
    console.log('[CategoryService] deleteCategory - Deleting category:', id);
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      console.log('[CategoryService] deleteCategory - Category not found');
      throw new NotFoundError('Category');
    }

    const children = await this.categoryRepository.findMany({ parentId: id });
    if (children.length > 0) {
      console.log('[CategoryService] deleteCategory - Cannot delete category with subcategories');
      throw new ConflictError('Cannot delete category with subcategories');
    }

    await this.categoryRepository.delete(id);
    console.log('[CategoryService] deleteCategory - Category deleted');
  }
}


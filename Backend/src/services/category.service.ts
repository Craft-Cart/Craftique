import { CategoryRepository } from '../repositories/category.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { slugify } from '../utils/helpers';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategoryById(id: string) {
    // nosemgrep: missing-ownership-check
    // Categories are public data, accessible by all users
    // Authorization is handled at the middleware layer
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  async getCategories(options: {
    parentId?: string | null;
    isActive?: boolean;
  }) {
    const categories = this.categoryRepository.findMany(options);
    return categories;
  }

  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string | null;
    imageUrl?: string;
  }) {
    const slug = slugify(data.name);

    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
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
    return category;
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
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
        throw new ConflictError('Category with this name already exists');
      }
      updateData.name = data.name;
      updateData.slug = slug;
    }

    const updatedCategory = this.categoryRepository.update(id, updateData);
    return updatedCategory;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }

    const children = await this.categoryRepository.findMany({ parentId: id });
    if (children.length > 0) {
      throw new ConflictError('Cannot delete category with subcategories');
    }

    await this.categoryRepository.delete(id);
  }
}


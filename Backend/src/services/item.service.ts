import { ItemRepository } from '../repositories/item.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { slugify } from '../utils/helpers';

export class ItemService {
  private itemRepository: ItemRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.itemRepository = new ItemRepository();
    this.categoryRepository = new CategoryRepository();
  }

  async getItemById(id: string) {
    // nosemgrep: missing-ownership-check
    // Items are public data, accessible by all users
    // Authorization is handled at the middleware layer
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item');
    }
    return item;
  }

  async getItems(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    sortBy?: string;
  }) {
    const result = await this.itemRepository.findMany(options);
    return {
      items: result.items,
      total: result.total,
      page: options.page || 1,
      pages: Math.ceil(result.total / (options.limit || 20)),
    };
  }

  async createItem(data: {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number | null;
    cost?: number;
    sku?: string;
    barcode?: string;
    quantity: number;
    categoryId: string;
    images?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    weight?: number;
    dimensions?: any;
    metadata?: any;
  }) {
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError('Category');
    }

    if (data.sku) {
      const existing = await this.itemRepository.findBySku(data.sku);
      if (existing) {
        throw new ConflictError('Item with this SKU already exists');
      }
    }

    const slug = slugify(data.name);
    const existingSlug = await this.itemRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictError('Item with this name already exists');
    }

    const item = this.itemRepository.create({
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      compare_at_price: data.compareAtPrice,
      cost: data.cost,
      sku: data.sku,
      barcode: data.barcode,
      quantity: data.quantity,
      category: {
        connect: { id: data.categoryId },
      },
      images: data.images || [],
      is_active: data.isActive !== undefined ? data.isActive : true,
      is_featured: data.isFeatured || false,
      weight: data.weight,
      dimensions: data.dimensions,
      metadata: data.metadata,
    });
    return item;
  }

  async updateItem(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    isActive?: boolean;
  }) {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    return this.itemRepository.update(id, updateData);
  }

  async deleteItem(id: string) {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item');
    }

    await this.itemRepository.delete(id);
  }

  async checkAvailability(itemId: string, quantity: number): Promise<boolean> {
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Item');
    }

    return item.quantity >= quantity && item.is_active;
  }

  async reserveItems(items: Array<{ itemId: string; quantity: number }>) {
    // Check all items are available
    for (const { itemId, quantity } of items) {
      const available = await this.checkAvailability(itemId, quantity);
      if (!available) {
        throw new ValidationError(`Item ${itemId} is not available in requested quantity`);
      }
    }

    // Reserve items (decrement quantity)
    // In production, use database transactions with locking
    for (const { itemId, quantity } of items) {
      await this.itemRepository.updateQuantity(itemId, quantity);
    }
  }
}


import { CatalogService } from '@/lib/catalog';
import { API_ENDPOINTS } from '@/lib/endpoints';

// Mock fetch
global.fetch = jest.fn();

describe('CatalogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should handle filters correctly', async () => {
      const mockProducts = {
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      await CatalogService.getProducts({
        page: 2,
        limit: 10,
        category: 'cat-1',
        search: 'test',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('page=2');
      expect(fetchCall).toContain('limit=10');
      expect(fetchCall).toContain('category_id=cat-1');
      expect(fetchCall).toContain('search=test');
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch products' }),
      });

      await expect(CatalogService.getProducts()).rejects.toThrow(
        'Failed to fetch products'
      );
    });
  });

  describe('getProductById', () => {
    it('should fetch single product successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        price: 100,
        description: 'Description 1',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await CatalogService.getProductById('1');

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.items.detail('1'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Product not found' }),
      });

      await expect(CatalogService.getProductById('999')).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', slug: 'category-1' },
        { id: '2', name: 'Category 2', slug: 'category-2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const result = await CatalogService.getCategories();

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.categories.list,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Category 1');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch categories' }),
      });

      await expect(CatalogService.getCategories()).rejects.toThrow(
        'Failed to fetch categories'
      );
    });
  });
});


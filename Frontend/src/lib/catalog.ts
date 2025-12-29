import { API_ENDPOINTS } from "@/lib/endpoints"
import type { Product, Category, PaginatedResponse, ProductFilters } from "@/lib/types"

export class CatalogService {
  private static getAuthHeaders(): HeadersInit {
    // Cookies are automatically sent with credentials: 'include'
    return {
      "Content-Type": "application/json",
    }
  }

  static async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    console.log('[CatalogService] getProducts - Fetching products with filters:', filters);
    const params = new URLSearchParams()

    if (filters?.page) params.append("page", filters.page.toString())
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.category) params.append("category_id", filters.category)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.inStock !== undefined) params.append("is_active", filters.inStock.toString())

    const url = `${API_ENDPOINTS.items.list}?${params.toString()}`
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch products" }))
      console.error('[CatalogService] getProducts - Error:', error);
      throw new Error(error.message || "Failed to fetch products")
    }

    const data = await response.json()
    console.log('[CatalogService] getProducts - Products retrieved:', data.items?.length, 'of', data.total);
    return {
      data: data.items || [],
      pagination: {
        page: data.page ||1,
        limit: filters?.limit || 10,
        total: data.total || 0,
        totalPages: data.pages || 1,
      },
    }
  }

    const data = await response.json()
    // Transform backend response to frontend format
    // Backend returns: { items, total, page, pages }
    // Frontend expects: { data, pagination: { page, limit, total, totalPages } }
    return {
      data: data.items || [],
      pagination: {
        page: data.page || 1,
        limit: filters?.limit || 10,
        total: data.total || 0,
        totalPages: data.pages || 1,
      },
    }
  }

  static async getProductById(id: string): Promise<Product> {
    console.log('[CatalogService] getProductById - Fetching product:', id);
    const url = API_ENDPOINTS.items.detail(id)
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch product" }))
      console.error('[CatalogService] getProductById - Error:', error);
      throw new Error(error.message || "Failed to fetch product")
    }

    const item = await response.json()
    console.log('[CatalogService] getProductById - Product retrieved:', item.name);
    return item as Product
  }

  static async getCategories(): Promise<Category[]> {
    console.log('[CatalogService] getCategories - Fetching categories');
    const url = API_ENDPOINTS.categories.list
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch categories" }))
      console.error('[CatalogService] getCategories - Error:', error);
      throw new Error(error.message || "Failed to fetch categories")
    }

    const categories = await response.json()
    console.log('[CatalogService] getCategories - Categories retrieved:', categories.length);
    return categories
  }
}

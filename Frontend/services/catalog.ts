import { API_ENDPOINTS } from "@/lib/endpoints"
import type { Product, Category, PaginatedResponse, ProductFilters } from "@/lib/types"

export class CatalogService {
  static async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams()

    if (filters?.page) params.append("page", filters.page.toString())
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.category) params.append("category", filters.category)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.minPrice !== undefined) params.append("minPrice", filters.minPrice.toString())
    if (filters?.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString())
    if (filters?.inStock !== undefined) params.append("inStock", filters.inStock.toString())

    const url = `${API_ENDPOINTS.products}?${params.toString()}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }

    return response.json()
  }

  static async getProductById(id: string): Promise<Product> {
    const url = `${API_ENDPOINTS.products}/${id}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch product")
    }

    return response.json()
  }

  static async getCategories(): Promise<Category[]> {
    const url = API_ENDPOINTS.categories
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch categories")
    }

    return response.json()
  }
}

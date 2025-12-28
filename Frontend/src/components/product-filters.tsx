"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category } from "@/lib/types"
import { X } from "lucide-react"

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategory = searchParams.get("category")
  const inStockOnly = searchParams.get("inStock") === "true"
  const minPrice = Number(searchParams.get("minPrice")) || 0
  const maxPrice = Number(searchParams.get("maxPrice")) || 500

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset to page 1 when filters change
    params.set("page", "1")

    router.push(`/?${params.toString()}`)
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    updateFilters({ category: checked ? category : null })
  }

  const handleInStockChange = (checked: boolean) => {
    updateFilters({ inStock: checked ? "true" : null })
  }

  const handlePriceChange = (values: number[]) => {
    const [min, max] = values
    updateFilters({
      minPrice: min > 0 ? String(min) : null,
      maxPrice: max < 500 ? String(max) : null,
    })
  }

  const clearFilters = () => {
    router.push("/")
  }

  const hasActiveFilters = selectedCategory || inStockOnly || minPrice > 0 || maxPrice < 500

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 px-2">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Category</Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategory === category.slug}
                  onCheckedChange={(checked) => handleCategoryChange(category.slug, checked as boolean)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="flex flex-1 cursor-pointer items-center justify-between text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">({category.count})</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Availability</Label>
          <div className="flex items-center space-x-2">
            <Checkbox id="in-stock" checked={inStockOnly} onCheckedChange={handleInStockChange} />
            <label
              htmlFor="in-stock"
              className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              In Stock Only
            </label>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="space-y-4 pt-2">
            <Slider
              min={0}
              max={500}
              step={10}
              value={[minPrice, maxPrice]}
              onValueChange={handlePriceChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${minPrice}</span>
              <span>${maxPrice}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

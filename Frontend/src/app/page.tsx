import { Suspense } from "react";
import { CatalogService } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { ProductSearch } from "@/components/product-search";
import { ProductPagination } from "@/components/product-pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
}

async function ProductsContent({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Number(params.page) ||1;
  const limit =8;

  const { data: products, pagination } = await CatalogService.getProducts({
    page,
    limit,
    category: params.category,
    search: params.search,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === "true" ? true : undefined,
  });

  const categories = await CatalogService.getCategories();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-balance">
          Discover Products
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse our curated collection of premium products
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <ProductFilters categories={categories} />
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Search Bar */}
          <ProductSearch />

          {/* Results Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {products.length} of {pagination.total} products
            </p>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center pt-4">
                <ProductPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductsSkeleton() {
  return (
    <main className="container py-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <Skeleton className="h-96 w-full" />
        </aside>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent {...props} />
    </Suspense>
  );
}

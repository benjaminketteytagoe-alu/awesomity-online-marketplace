import { useProducts } from '@/features/products/product.queries';
import {
  useProductFilters,
  toApiParams,
} from '@/features/products/useProductFilters';
import { ProductGrid } from '@/features/products/ProductGrid';
import { ProductSkeletonGrid } from '@/features/products/ProductSkeleton';
import { Pagination } from '@/features/products/Pagination';
import { ProductFilters } from '@/features/products/ProductFilters';
import { useCategories } from '@/features/categories/category.queries';
import { toErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

/**
 * The catalog page — where users browse, search, and filter products.
 *
 * URL-driven. The URL is the source of truth for filters and page
 * number. This means:
 *   - The URL is shareable: /products?category=electronics&page=2
 *   - Browser back/forward works through filter changes
 *   - Refresh preserves the current view
 */
export function ProductsPage() {
  const { filters, setFilters, clearFilters } = useProductFilters();
  const apiParams = toApiParams(filters);

  const productsQuery = useProducts(apiParams);
  const categoriesQuery = useCategories();

  // Context-aware empty messaging. A user who clicked a category with
  // no products shouldn't see "adjust your search" — they didn't search.
  // A user who typed a search term and got nothing should see the
  // "try a different keyword" message. We pick based on which filter
  // is actually set.
  const emptyTitle = filters.search
    ? 'No products match your search'
    : filters.category
      ? 'No products in this category yet'
      : 'No products available';

  const emptyDescription = filters.search
    ? 'Try a different keyword, or clear your search to see everything.'
    : filters.category
      ? 'Check back soon — new products are added regularly.'
      : 'Products will appear here once sellers list them.';

  return (
    <div className="container py-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Products
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our marketplace — search, filter, and sort to find what
          you're looking for.
        </p>
      </header>

      {/* Filters bar — categories come from the API once loaded */}
      <div className="mb-6">
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClear={clearFilters}
          categories={categoriesQuery.data ?? []}
        />
      </div>

      {/* Result count */}
      {productsQuery.isSuccess && (
        <p className="mb-4 text-sm text-muted-foreground">
          {productsQuery.data.totalElements === 0
            ? 'No results'
            : `${productsQuery.data.totalElements.toLocaleString()} ${
                productsQuery.data.totalElements === 1
                  ? 'product'
                  : 'products'
              }`}
        </p>
      )}

      {/* Loading */}
      {productsQuery.isLoading && (
        <ProductSkeletonGrid count={filters.size} />
      )}

      {/* Error */}
      {productsQuery.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {toErrorMessage(productsQuery.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => productsQuery.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Success */}
      {productsQuery.isSuccess && (
        <ProductGrid
          products={productsQuery.data.content}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}

      {/* Pagination */}
      {productsQuery.isSuccess && (
        <Pagination
          className="mt-10"
          page={filters.page}
          totalPages={productsQuery.data.totalPages}
          onPageChange={(p) => {
            setFilters({ page: p });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

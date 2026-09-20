import { useProducts } from '@/features/products/product.queries';
import { useProductFilters, toApiParams } from '@/features/products/useProductFilters';
import { ProductGrid } from '@/features/products/ProductGrid';
import { ProductSkeletonGrid } from '@/features/products/ProductSkeleton';
import { Pagination } from '@/features/products/Pagination';
import { ProductFilters } from '@/features/products/ProductFilters';
import { toErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

/**
 * The catalog page — where users browse, search, and filter products.
 *
 * URL-driven. The URL is the source of truth for filters and page
 * number. This means:
 *   - The URL is shareable: `/products?category=electronics&page=2`
 *   - Browser back/forward works through filter changes
 *   - Refresh preserves the current view
 *
 * The page itself is thin. It:
 *   1. Reads filters from the URL (useProductFilters)
 *   2. Fetches products with those filters (useProducts)
 *   3. Renders: filters bar -> (skeleton | error | grid) -> pagination
 */
export function ProductsPage() {
  const { filters, setFilters, clearFilters } = useProductFilters();
  const apiParams = toApiParams(filters);

  const query = useProducts(apiParams);

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

      {/* Filters bar — always visible, always interactive */}
      <div className="mb-6">
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClear={clearFilters}
          categories={[]} // wired to /api/categories in Step 14.5
        />
      </div>

      {/* Result count + status */}
      {query.isSuccess && (
        <p className="mb-4 text-sm text-muted-foreground">
          {query.data.totalElements === 0
            ? 'No results'
            : `${query.data.totalElements.toLocaleString()} ${
                query.data.totalElements === 1 ? 'product' : 'products'
              }`}
        </p>
      )}

      {/* Loading state */}
      {query.isLoading && <ProductSkeletonGrid count={filters.size} />}

      {/* Error state */}
      {query.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {toErrorMessage(query.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => query.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Success: grid or empty state */}
      {query.isSuccess && (
        <ProductGrid
          products={query.data.content}
          emptyTitle="No products match your search"
          emptyDescription="Try a different keyword, category, or clear your filters."
        />
      )}

      {/* Pagination — only when there's more than one page */}
      {query.isSuccess && (
        <Pagination
          className="mt-10"
          page={filters.page}
          totalPages={query.data.totalPages}
          onPageChange={(p) => {
            setFilters({ page: p });
            // Scroll to top on page change — otherwise the user stays
            // mid-scroll when the new page loads and gets disoriented.
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

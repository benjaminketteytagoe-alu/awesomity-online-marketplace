import { FolderOpen } from 'lucide-react';
import { useCategories } from '@/features/categories/category.queries';
import { CategoryCard } from '@/features/categories/CategoryCard';
import { CategorySkeletonGrid } from '@/features/categories/CategorySkeleton';
import { toErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

/**
 * Categories browse page.
 *
 * A grid of category cards. Clicking a category navigates to
 * /products?category=<slug>, where the product catalog handles the
 * filtering via its URL-as-state hook.
 *
 * Same three-state pattern as ProductsPage:
 *   loading -> skeleton grid
 *   error   -> alert card with retry
 *   success -> cards, or an empty state
 */
export function CategoriesPage() {
  const query = useCategories();

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Categories
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse products by category.
        </p>
      </header>

      {query.isLoading && <CategorySkeletonGrid count={6} />}

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

      {query.isSuccess && query.data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium text-foreground">
            No categories yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Categories will appear here once they are set up.
          </p>
        </div>
      )}

      {query.isSuccess && query.data.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

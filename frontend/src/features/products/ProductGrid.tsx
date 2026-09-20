import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from './product.types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  /**
   * Optional empty-state content. Callers can pass a custom message
   * ("No products match your search") while default text is provided
   * for the generic case.
   */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Responsive product grid.
 *
 * Column strategy:
 *   1 column on mobile (each card gets full width, thumb-friendly)
 *   2 columns on small tablets
 *   3 columns on desktop
 *   4 columns on wide desktop
 *
 * The same grid class is used in ProductSkeletonGrid — that's why the
 * loading state doesn't reflow when data arrives.
 */
export function ProductGrid({
  products,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center',
          className,
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
          <PackageOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-display text-base font-medium text-foreground">
          {emptyTitle}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

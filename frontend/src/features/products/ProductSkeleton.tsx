import { cn } from '@/lib/utils';

/**
 * Loading placeholder for a product card.
 *
 * Design: mirror ProductCard's dimensions exactly (same aspect ratio for
 * the image area, same spacing, same text line heights). When real data
 * arrives, the layout doesn't jump — each skeleton is replaced by a card
 * of identical size. That's the difference between a jarring flicker and
 * a smooth reveal.
 *
 * The `animate-pulse` class comes from Tailwind's built-ins. We don't
 * hand-roll a shimmer effect; the built-in is good enough and zero cost.
 */
export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-surface',
        className,
      )}
      // aria-hidden: skeleton is decorative. The parent grid should
      // announce "loading" via its own aria-busy / status region.
      aria-hidden="true"
    >
      {/* Image placeholder — square */}
      <div className="aspect-square w-full animate-pulse bg-muted" />

      {/* Text block */}
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

/**
 * Grid of skeletons for the loading state. Uses the same responsive
 * column count as ProductGrid so there's no reflow when data arrives.
 */
export function ProductSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

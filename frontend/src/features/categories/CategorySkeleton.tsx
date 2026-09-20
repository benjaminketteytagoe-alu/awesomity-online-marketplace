/**
 * Loading placeholder for a category card.
 *
 * Matches the real card's dimensions exactly:
 *   - same aspect ratio (4/3)
 *   - same rounded radius (rounded-2xl)
 *   - same padding rhythm (p-6)
 *
 * This is what "no layout shift" looks like in practice: when data
 * arrives, the browser doesn't have to recalculate the grid.
 */
export function CategorySkeleton() {
  return (
    <div
      className="flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-muted/50 p-6"
      aria-hidden="true"
    >
      <div className="space-y-2">
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="flex items-end justify-between">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

/**
 * Grid of skeletons for the categories page loading state. Same column
 * layout as the real grid so no reflow on data arrival.
 */
export function CategorySkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  );
}

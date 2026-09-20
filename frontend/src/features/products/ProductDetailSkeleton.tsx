/**
 * Loading skeleton for the product detail page.
 *
 * Mirrors the real layout's dimensions (aspect-square hero, same text
 * block spacing, same right-column CTA panel) so when data arrives the
 * page doesn't reflow. This is what "no layout shift" looks like in
 * practice.
 *
 * Every animated block uses Tailwind's built-in `animate-pulse` — no
 * custom shimmer keyframes to maintain.
 */
export function ProductDetailSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-8 lg:grid-cols-2"
      role="status"
      aria-label="Loading product"
    >
      {/* ---------- Hero image placeholder ---------- */}
      <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />

      {/* ---------- Right column ---------- */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumb placeholder */}
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />

        {/* Name */}
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />

        {/* Store / category line */}
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />

        {/* Price */}
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />

        {/* Stock badge */}
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />

        {/* Description lines */}
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

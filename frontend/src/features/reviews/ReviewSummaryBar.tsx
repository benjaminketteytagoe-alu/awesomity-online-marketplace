import { StarRating } from './StarRating';

interface ReviewSummaryBarProps {
  averageRating: number;
  totalReviews: number;
}

/**
 * The "4.5 stars based on 23 reviews" bar that sits at the top of
 * the reviews section.
 */
export function ReviewSummaryBar({
  averageRating,
  totalReviews,
}: ReviewSummaryBarProps) {
  if (totalReviews === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          No reviews yet — be the first to review this product.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="flex flex-col items-center">
        <span className="font-display text-3xl font-semibold tabular-nums">
          {averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">out of 5</span>
      </div>
      <div className="flex-1 border-l border-border pl-4">
        <StarRating value={averageRating} size="md" />
        <p className="mt-1 text-xs text-muted-foreground">
          Based on {totalReviews}{' '}
          {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>
    </div>
  );
}

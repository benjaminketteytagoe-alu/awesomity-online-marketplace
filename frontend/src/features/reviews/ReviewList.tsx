import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import type { Review } from './review.types';

interface ReviewListProps {
  reviews: Review[];
  totalPages: number;
  currentPage: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

/**
 * List of review cards with a "Load more" button when there are
 * additional pages.
 *
 * Cards, not a table — reviews are prose + a rating. Tables would
 * squeeze the comment column awkwardly.
 */
export function ReviewList({
  reviews,
  totalPages,
  currentPage,
  onLoadMore,
  isLoadingMore,
}: ReviewListProps) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {currentPage < totalPages - 1 && (
        <div className="pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            isLoading={isLoadingMore}
          >
            Load more reviews
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{review.userName}</span>
            <StarRating value={review.rating} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </p>
        </div>
      </header>

      {review.comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {review.comment}
        </p>
      )}
    </article>
  );
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

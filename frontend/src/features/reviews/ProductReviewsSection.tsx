import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCanReview,
  useDeleteReview,
  useProductReviews,
  useReviewSummary,
} from './review.queries';
import { ReviewSummaryBar } from './ReviewSummaryBar';
import { ReviewList } from './ReviewList';
import { ReviewFormModal } from './ReviewForm';

const PAGE_SIZE = 5;

interface ProductReviewsSectionProps {
  productId: string;
}

/**
 * The reviews section on the product detail page.
 *
 * Composes:
 *   - Summary bar (average + count)
 *   - CTA (Write / Edit / Login / nothing) driven by can-review
 *   - List with Load more
 *
 * The CTA logic is the interesting part — see the render logic below.
 */
export function ProductReviewsSection({
  productId,
}: ProductReviewsSectionProps) {
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  const summaryQuery = useReviewSummary(productId);
  const canReviewQuery = useCanReview(productId);
  const listQuery = useProductReviews(productId, {
    page,
    size: PAGE_SIZE,
  });

  const deleteMutation = useDeleteReview(productId);

  const handleLoadMore = () => setPage((p) => p + 1);

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(reviewId);
      toast.success('Review deleted');
      setPage(0);
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  const summary = summaryQuery.data;
  const canReview = canReviewQuery.data;
  const reviews = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;

  return (
    <section
      id="reviews"
      aria-label="Product reviews"
      className="mt-10 border-t border-border pt-8"
    >
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          Reviews
          {summary && summary.totalReviews > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({summary.totalReviews})
            </span>
          )}
        </h2>

        <ReviewCta
          isAuthenticated={isAuthenticated}
          canReview={canReview}
          loginRedirectFrom={location.pathname + '#reviews'}
          onWriteReview={() => setIsFormOpen(true)}
        />
      </header>

      {summary && (
        <div className="mb-5">
          <ReviewSummaryBar
            averageRating={summary.averageRating}
            totalReviews={summary.totalReviews}
          />
        </div>
      )}

      {/* Reviewer's own actions when they already have a review */}
      {canReview?.hasReviewed && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3">
          <span className="text-sm text-brand-foreground/90">
            You've reviewed this product.
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            {canReview.existingReviewId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleDelete(canReview.existingReviewId!)
                }
                disabled={deleteMutation.isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {reviews.length > 0 && (
        <ReviewList
          reviews={reviews}
          currentPage={page}
          totalPages={totalPages}
          onLoadMore={handleLoadMore}
          isLoadingMore={listQuery.isFetching}
        />
      )}

      {/* Review form modal */}
      {canReview?.existingReviewId && (
        <ReviewFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          productId={productId}
          existingReview={
            canReview.hasReviewed
              ? reviews.find((r) => r.id === canReview.existingReviewId)
              : undefined
          }
        />
      )}
      {!canReview?.hasReviewed && (
        <ReviewFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          productId={productId}
        />
      )}
    </section>
  );
}

/* ---------------- CTA logic ---------------- */

/**
 * The CTA is driven by three factors:
 *   - Is the user authenticated?
 *   - Does the can-review query say they can review?
 *   - Do they already have a review?
 *
 * Four states are rendered. The "cannot review, not reviewed" state
 * shows a small explanatory note (only when authenticated, to avoid
 * cluttering the anonymous view).
 */
function ReviewCta({
  isAuthenticated,
  canReview,
  loginRedirectFrom,
  onWriteReview,
}: {
  isAuthenticated: boolean;
  canReview: import('./review.types').CanReview | undefined;
  loginRedirectFrom: string;
  onWriteReview: () => void;
}) {
  // Not logged in → prompt login
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        state={{ from: loginRedirectFrom }}
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Log in to write a review
      </Link>
    );
  }

  // Not loaded yet — don't flash a CTA we might retract
  if (!canReview) return null;

  if (canReview.canReview) {
    return (
      <Button type="button" size="sm" onClick={onWriteReview}>
        Write a review
      </Button>
    );
  }

  if (canReview.hasReviewed) {
    // Actions rendered inside the section body below.
    return null;
  }

  // Authenticated shopper who hasn't purchased
  return (
    <span className="text-xs text-muted-foreground">
      Available after purchase
    </span>
  );
}

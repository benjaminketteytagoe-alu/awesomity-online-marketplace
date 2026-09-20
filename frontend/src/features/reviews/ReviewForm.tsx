import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { StarRatingInput } from './StarRatingInput';
import { toErrorMessage } from '@/lib/api/client';
import { useCreateReview, useUpdateReview } from './review.queries';
import type { Rating, Review } from './review.types';

const MAX_COMMENT = 2000;

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  /** When present, the modal is in edit mode. */
  existingReview?: Review;
}

/**
 * Create/edit review modal.
 *
 * One component, two modes — create when `existingReview` is absent,
 * edit when present. Simpler than two components because the fields
 * are identical.
 */
export function ReviewFormModal({
  isOpen,
  onClose,
  productId,
  existingReview,
}: ReviewFormModalProps) {
  const isEdit = Boolean(existingReview);
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string | undefined>();

  const createMutation = useCreateReview(productId);
  const updateMutation = useUpdateReview(productId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset/init when opened
  useEffect(() => {
    if (!isOpen) return;
    setRating(existingReview?.rating ?? null);
    setComment(existingReview?.comment ?? '');
    setRatingError(undefined);
  }, [isOpen, existingReview]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isPending, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating) {
      setRatingError('Please select a rating');
      return;
    }
    try {
      const payload = {
        rating,
        comment: comment.trim().length > 0 ? comment.trim() : null,
      };
      if (isEdit && existingReview) {
        await updateMutation.mutateAsync({
          id: existingReview.id,
          payload,
        });
        toast.success('Review updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Review posted');
      }
      onClose();
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => !isPending && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id="review-form-title"
            className="font-display text-lg font-medium tracking-tight"
          >
            {isEdit ? 'Edit your review' : 'Write a review'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Your rating <span className="text-destructive">*</span>
            </label>
            <StarRatingInput
              value={rating}
              onChange={(r) => {
                setRating(r);
                setRatingError(undefined);
              }}
              disabled={isPending}
              error={ratingError}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-sm font-medium text-foreground"
              >
                Your review <span className="text-muted-foreground">(optional)</span>
              </label>
              <span
                className={`text-xs ${
                  comment.length > MAX_COMMENT - 100
                    ? 'text-warning'
                    : 'text-muted-foreground'
                }`}
              >
                {comment.length} / {MAX_COMMENT}
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_COMMENT}
              disabled={isPending}
              placeholder="Share what you liked or didn't like about this product…"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <footer className="flex gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Post review'
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
}

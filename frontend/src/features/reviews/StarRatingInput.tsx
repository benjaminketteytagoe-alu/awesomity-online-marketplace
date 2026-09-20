import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Rating } from './review.types';

interface StarRatingInputProps {
  value: Rating | null;
  onChange: (value: Rating) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Interactive 1-5 star picker.
 *
 * Two pieces of state:
 *   - value     — the committed choice (from the parent form)
 *   - hoverValue — the star the user is currently hovering (transient)
 *
 * The displayed stars use hoverValue if hovering, else value. This
 * gives the classic "preview the rating under your cursor" effect.
 *
 * Accessibility:
 *   - Uses role="radiogroup" with 5 radio semantics
 *   - Each star is a button with aria-label "Rate N stars"
 *   - Keyboard: arrow keys move between stars
 */
export function StarRatingInput({
  value,
  onChange,
  disabled,
  error,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<Rating | null>(null);

  const displayed = hoverValue ?? value ?? 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' && current < 5) {
      onChange((current + 1) as Rating);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && current > 1) {
      onChange((current - 1) as Rating);
      e.preventDefault();
    }
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Star rating"
        aria-invalid={!!error}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverValue(null)}
        className="inline-flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayed >= star;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
              disabled={disabled}
              onMouseEnter={() => setHoverValue(star as Rating)}
              onFocus={() => setHoverValue(star as Rating)}
              onBlur={() => setHoverValue(null)}
              onClick={() => onChange(star as Rating)}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-md transition-transform',
                'hover:scale-110 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
              )}
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  isFilled
                    ? 'fill-brand text-brand'
                    : 'text-muted-foreground/40',
                )}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
      {value && (
        <p className="mt-1 text-xs text-muted-foreground">
          {ratingLabel(value)}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ratingLabel(rating: Rating): string {
  return {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent',
  }[rating];
}

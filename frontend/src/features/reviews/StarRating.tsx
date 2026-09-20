import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Average rating, e.g. 4.3. Rendered as filled/half/empty stars. */
  value: number;
  /** Number of stars. Default 5. */
  max?: number;
  /** Icon size in Tailwind classes. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Read-only star display.
 *
 * Supports fractional values: fills whole stars, and paints partial
 * fills for the decimal portion using a two-layer approach — an
 * outline layer with a clipped filled layer on top.
 *
 * For simplicity here we round to the nearest half-star, which reads
 * naturally. Real systems sometimes paint exact fractions; the half-
 * star approximation is 95% as good and much less code.
 */
export function StarRating({
  value,
  max = 5,
  size = 'md',
  className,
}: StarRatingProps) {
  const sizeClass = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  // Round to nearest half for the display
  const rounded = Math.round(value * 2) / 2;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const fill =
          rounded >= starValue
            ? 'full'
            : rounded >= starValue - 0.5
              ? 'half'
              : 'empty';

        return (
          <span key={i} className="relative inline-flex">
            {/* Base outline star */}
            <Star
              className={cn(
                sizeClass,
                'text-border',
                fill === 'full' && 'hidden',
              )}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {/* Filled overlay, clipped for half-stars */}
            {fill === 'full' && (
              <Star
                className={cn(sizeClass, 'fill-brand text-brand')}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )}
            {fill === 'half' && (
              <span className="absolute inset-0 overflow-hidden [width:50%]">
                <Star
                  className={cn(sizeClass, 'fill-brand text-brand')}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

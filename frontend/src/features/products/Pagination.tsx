import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildWindow } from './pagination.utils';

interface PaginationProps {
  /** Current page, 1-indexed (matches our URL convention). */
  page: number;
  /** Total number of pages. If <= 1, the component renders nothing. */
  totalPages: number;
  /** Called with the requested 1-indexed page number. */
  onPageChange: (page: number) => void;
  /** How many page numbers to show on each side of current. Default 2. */
  windowSize?: number;
  className?: string;
}

/**
 * Windowed pagination control.
 *
 * Renders: prev · page numbers with ellipses · next.
 *
 * Window algorithm lives in pagination.utils.ts (buildWindow) so this
 * file exports only the component — see that file's header for the
 * react-refresh reasoning.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  windowSize = 2,
  className,
}: PaginationProps) {
  // Single page -> nothing to paginate. Returning null is cleaner than
  // rendering a lonely "1".
  if (totalPages <= 1) return null;

  const pages = buildWindow(page, totalPages, windowSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <PageButton
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageButton>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          // Key includes index because ellipses are not unique values.
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            onClick={() => onPageChange(p)}
            isCurrent={p === page}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}

/**
 * Internal button — kept here because it is a component, and this file
 * may only export components (see file header).
 */
function PageButton({
  children,
  onClick,
  disabled,
  isCurrent,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isCurrent?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        isCurrent
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-muted',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

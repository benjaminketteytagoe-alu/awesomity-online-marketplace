import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SellerStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  /** Optional link — if present, the whole card becomes a Link. */
  to?: string;
  /** Optional tone — highlights the card when > 0. */
  tone?: 'neutral' | 'warning' | 'success';
  className?: string;
}

/**
 * A single stat tile on the seller overview.
 *
 * Simple by design — no animations, no sparklines, no sparkle. The
 * number, the label, an optional hint. This is what makes a dashboard
 * feel considered: restraint.
 */
export function SellerStatCard({
  label,
  value,
  hint,
  icon,
  to,
  tone = 'neutral',
  className,
}: SellerStatCardProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border bg-surface p-5',
        'transition-colors',
        to && 'hover:border-foreground/20 hover:bg-muted/40',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'text-muted-foreground',
              tone === 'warning' && 'text-warning',
              tone === 'success' && 'text-success',
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p
        className={cn(
          'font-display text-3xl font-semibold tabular-nums',
          tone === 'warning' && 'text-warning',
          tone === 'success' && 'text-success',
        )}
      >
        {value}
      </p>

      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-xl"
      >
        {content}
      </Link>
    );
  }
  return content;
}

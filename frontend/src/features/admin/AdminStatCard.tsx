import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  to?: string;
  tone?: 'neutral' | 'warning' | 'brand';
  className?: string;
}

/**
 * Admin overview stat tile.
 *
 * Same visual language as the seller's stat card — different tone
 * palette. The admin sees brand-tinted tiles (god mode), not warning/
 * success tiles (which the seller uses for their own business state).
 */
export function AdminStatCard({
  label,
  value,
  hint,
  icon,
  to,
  tone = 'neutral',
  className,
}: AdminStatCardProps) {
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
              tone === 'brand' && 'text-brand',
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
          tone === 'brand' && 'text-brand',
        )}
      >
        {value}
      </p>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    );
  }
  return content;
}

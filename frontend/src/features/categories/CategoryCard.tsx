import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from './category.types';
import { categoryInitials, themeFor } from './categoryVisuals';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

/**
 * Category tile — full-bleed deep gradient card.
 *
 * Design intent:
 *   - The whole card is the visual, not a thumbnail + text block.
 *     Categories are navigation destinations, not data records, so
 *     they get a poster treatment.
 *   - The monogram sits in the top-right corner as a low-opacity
 *     ornament. It adds texture without competing with the name.
 *   - The name is the primary element. The subtitle is supporting.
 *   - An arrow in the bottom-right is the affordance — bigger on
 *     hover, slides diagonally. The whole card is the link.
 *
 * Accessibility:
 *   - Single <Link> wraps the whole card: one tab stop, one target.
 *   - aria-label includes the category name and the action.
 *   - The monogram is aria-hidden (decorative — the name is right
 *     there in text).
 */
export function CategoryCard({ category, className }: CategoryCardProps) {
  const theme = themeFor(category.slug);
  const initials = categoryInitials(category.name);

  const subtitle =
    category.description ?? `Browse products in ${category.name}`;

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      aria-label={`Browse ${category.name}`}
      className={cn(
        'group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl',
        'bg-gradient-to-br p-6',
        theme.bg,
        'transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {/* ---------- Monogram ornament ---------- */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-4 -top-6 select-none',
          'font-display text-[9rem] font-semibold leading-none tracking-tight',
          theme.ornament,
        )}
      >
        {initials}
      </span>

      {/* ---------- Top: name + subtitle ---------- */}
      <div className="relative z-10">
        <h3
          className={cn(
            'font-display text-2xl font-semibold leading-tight tracking-tight',
            theme.fg,
          )}
        >
          {category.name}
        </h3>
        <p className={cn('mt-1.5 line-clamp-2 text-sm', theme.fgMuted)}>
          {subtitle}
        </p>
      </div>

      {/* ---------- Bottom: arrow affordance ---------- */}
      <div className="relative z-10 flex items-end justify-between">
        {/* Small accent dot — subtle visual hint of the theme's accent */}
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', theme.accent)}
        />

        {/* Arrow — grows and slides on hover */}
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full border transition-all duration-300',
            'border-white/20 bg-white/5 backdrop-blur-sm',
            'group-hover:border-white/40 group-hover:bg-white/10',
          )}
        >
          <ArrowUpRight
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              'group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
              theme.fg,
            )}
          />
        </span>
      </div>
    </Link>
  );
}

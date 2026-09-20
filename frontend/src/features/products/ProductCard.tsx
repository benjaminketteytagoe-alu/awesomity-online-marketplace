import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from './product.types';
import {
  formatPrice,
  gradientFor,
  initialsFor,
  stockState,
} from './productVisuals';

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * One product tile.
 *
 * Renders without needing any extra fetches — the API denormalizes
 * storeName, categoryName, and categorySlug into the product response.
 * That's why this component can be a pure function of `product`.
 *
 * Accessibility notes:
 *   - The whole card is a single <Link>. Users get one tab stop, not five.
 *   - aria-label on the link includes product name + price so screen
 *     readers announce something meaningful instead of "link".
 *   - The stock badge uses role="status" so its text is announced when
 *     it appears (e.g. after a filter change).
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const stock = stockState(product.stock);
  const gradient = gradientFor(product.name);
  const initials = initialsFor(product.name);
  const isOutOfStock = stock === 'out-of-stock';

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-surface',
        'transition-all duration-200 hover:border-foreground/20 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Out-of-stock cards are dimmed but still navigable (users may
        // want to see the detail page for a wishlist save, or a restock
        // notification signup later).
        isOutOfStock && 'opacity-70',
        className,
      )}
      aria-label={`${product.name}, ${formatPrice(product.price)}${
        isOutOfStock ? ', out of stock' : ''
      }`}
    >
      {/* ---------- Image area ---------- */}
      <div className="relative aspect-square w-full overflow-hidden">
        {/* Gradient placeholder — swapped for <img> when the backend
            starts returning imageUrl. */}
        <div
          className={cn(
            'grid h-full w-full place-items-center bg-gradient-to-br',
            gradient,
          )}
        >
          <span className="select-none font-display text-4xl font-medium text-foreground/70">
            {initials}
          </span>
        </div>

        {/* Featured badge — only when featured */}
        {product.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-brand-foreground">
            Featured
          </span>
        )}

        {/* Out-of-stock overlay badge */}
        {isOutOfStock && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background">
            <Package className="h-3 w-3" />
            Out of stock
          </span>
        )}
      </div>

      {/* ---------- Text block ---------- */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        {/* Category + store — small, muted, one line */}
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.categoryName}
          <span className="mx-1.5 text-border">·</span>
          {product.storeName}
        </p>

        {/* Product name — two-line clamp so long names don't break layout */}
        <h3 className="line-clamp-2 font-display text-base font-medium leading-snug text-foreground">
          {product.name}
        </h3>

        {/* Price + stock status — pushed to bottom with mt-auto */}
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
          <span className="font-display text-lg font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>

          {stock === 'low-stock' && (
            <span
              role="status"
              className="text-xs font-medium text-warning"
            >
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

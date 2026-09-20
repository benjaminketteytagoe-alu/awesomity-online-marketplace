import { Link } from 'react-router-dom';
import { Star, Sparkles, Trash2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  formatPrice,
  gradientFor,
  initialsFor,
  stockState,
} from '@/features/products/productVisuals';
import { useFeatureProduct } from './admin.queries';
import type { Product } from './admin.types';

interface AdminProductRowProps {
  product: Product;
  onDelete: () => void;
}

/**
 * One product row in the admin products list.
 *
 * Actions:
 *   - Featured toggle (star): filled = featured, outline = not.
 *     Clicking fires useFeatureProduct which invalidates productKeys
 *     so the buyer's catalog and featured rail refresh automatically.
 *   - Delete: opens a confirmation modal in the parent.
 *
 * No edit action — content management (name, price, stock) is the
 * seller's responsibility, not the admin's.
 */
export function AdminProductRow({
  product,
  onDelete,
}: AdminProductRowProps) {
  const featureMutation = useFeatureProduct();
  const gradient = gradientFor(product.name);
  const initials = initialsFor(product.name);
  const stock = stockState(product.stock);

  const handleToggleFeatured = () => {
    featureMutation.mutate({ id: product.id, featured: !product.featured });
  };

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
      {/* Thumbnail */}
      <Link
        to={`/products/${product.id}`}
        className={cn(
          'grid h-16 w-16 shrink-0 place-items-center rounded-lg',
          'bg-gradient-to-br',
          gradient,
        )}
        aria-label={`Preview ${product.name}`}
      >
        <span className="font-display text-base font-medium text-foreground/70">
          {initials}
        </span>
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/products/${product.id}`}
            className="line-clamp-1 font-display text-base font-medium hover:underline"
          >
            {product.name}
          </Link>
          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
              <Sparkles className="h-2.5 w-2.5" />
              Featured
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Store className="h-3 w-3" />
            {product.storeName}
          </span>
          <span>{product.categoryName}</span>
          <span
            className={cn(
              stock === 'out-of-stock' && 'font-medium text-destructive',
              stock === 'low-stock' && 'font-medium text-warning',
            )}
          >
            {stock === 'out-of-stock'
              ? 'Out of stock'
              : stock === 'low-stock'
                ? `Only ${product.stock} left`
                : `${product.stock} in stock`}
          </span>
        </div>
      </div>

      {/* Price */}
      <span className="font-display text-base font-semibold tabular-nums">
        {formatPrice(product.price)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleToggleFeatured}
          disabled={featureMutation.isPending}
          aria-label={
            product.featured ? 'Remove from featured' : 'Mark as featured'
          }
          title={product.featured ? 'Remove from featured' : 'Mark as featured'}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-lg transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            product.featured
              ? 'text-brand hover:bg-brand/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Star
            className={cn(
              'h-4 w-4',
              product.featured && 'fill-brand',
            )}
          />
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${product.name}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

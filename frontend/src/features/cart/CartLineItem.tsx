import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatPrice, gradientFor, initialsFor } from '@/features/products/productVisuals';
import type { CartItem } from './cart.types';
import { useCartStore } from './cart.store';
import { useCartDrawerStore } from './cartDrawer.store';

interface CartLineItemProps {
  item: CartItem;
}

/**
 * One line in the cart drawer.
 *
 * The gradient thumbnail mirrors the product card — same hash, same
 * color. Visual continuity from product page to cart reinforces that
 * it's the same item.
 */
export function CartLineItem({ item }: CartLineItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const closeDrawer = useCartDrawerStore((s) => s.close);

  const gradient = gradientFor(item.name);
  const initials = initialsFor(item.name);
  const lineTotal = item.price * item.quantity;

  const atMax = item.quantity >= item.stockAtAddTime;

  return (
    <li className="flex gap-3 py-4">
      {/* Thumbnail */}
      <Link
        to={`/products/${item.productId}`}
        onClick={closeDrawer}
        className={cn(
          'grid h-16 w-16 shrink-0 place-items-center rounded-lg',
          'bg-gradient-to-br',
          gradient,
        )}
        aria-label={`View ${item.name}`}
      >
        <span className="font-display text-lg font-medium text-foreground/70">
          {initials}
        </span>
      </Link>

      {/* Info column */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${item.productId}`}
            onClick={closeDrawer}
            className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{item.storeName}</p>

        <div className="mt-1 flex items-center justify-between gap-2">
          {/* Quantity stepper */}
          <div className="flex h-7 items-center rounded-md border border-border bg-surface">
            <button
              type="button"
              onClick={() =>
                updateQuantity(item.productId, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className={cn(
                'grid h-full w-7 place-items-center rounded-l-md text-xs',
                'transition-colors hover:bg-muted',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
              )}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="grid h-full w-8 place-items-center text-xs font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                updateQuantity(item.productId, item.quantity + 1)
              }
              disabled={atMax}
              aria-label="Increase quantity"
              className={cn(
                'grid h-full w-7 place-items-center rounded-r-md text-xs',
                'transition-colors hover:bg-muted',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
              )}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <span className="font-display text-sm font-semibold tabular-nums">
            {formatPrice(lineTotal)}
          </span>
        </div>
      </div>
    </li>
  );
}

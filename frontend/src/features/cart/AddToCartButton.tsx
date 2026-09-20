import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/features/products/product.types';
import { formatPrice } from '@/features/products/productVisuals';
import { useCartStore } from './cart.store';
import { useCartDrawerStore } from './cartDrawer.store';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
}

/**
 * Quantity picker + add-to-cart button for the product detail page.
 *
 * Behavior:
 *   - Capped at product.stock. If stock is 0, the button is disabled
 *     with a clear label.
 *   - Shows the total for the chosen quantity (£49.99 × 2 = £99.98).
 *   - On click: adds to cart, opens the drawer, and briefly shows
 *     "Added" state on the button for tactile feedback.
 *   - The "Added" state auto-reverts after 1.5s so it doesn't stick.
 */
export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartDrawerStore((s) => s.open);

  const isOutOfStock = product.stock <= 0;
  const max = Math.max(1, product.stock);
  const lineTotal = product.price * quantity;

  const increment = () => setQuantity((q) => Math.min(q + 1, max));
  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAdd = () => {
    addItem(product, quantity);
    openDrawer();
    setJustAdded(true);
    // Revert the "Added" indicator after 1.5s. We use setTimeout, but
    // the component will unmount if the user navigates — no leak
    // concerns in practice for a 1.5s timer.
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  if (isOutOfStock) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          disabled
          className="w-full"
        >
          <ShoppingBag className="h-4 w-4" />
          Out of stock
        </Button>
        <p className="text-xs text-muted-foreground">
          This product is currently unavailable. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Quantity + Add row */}
      <div className="flex items-stretch gap-2">
        {/* Quantity stepper */}
        <div className="flex h-11 items-center rounded-lg border border-border bg-surface">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className={cn(
              'grid h-full w-10 place-items-center rounded-l-lg',
              'text-foreground transition-colors hover:bg-muted',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
            )}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className="grid h-full w-12 place-items-center font-display text-base font-medium tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= max}
            aria-label="Increase quantity"
            className={cn(
              'grid h-full w-10 place-items-center rounded-r-lg',
              'text-foreground transition-colors hover:bg-muted',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add to cart button */}
        <Button
          type="button"
          size="lg"
          onClick={handleAdd}
          className={cn('flex-1', justAdded && 'bg-success hover:bg-success/90')}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </>
          )}
        </Button>
      </div>

      {/* Total for the chosen quantity — only shown when qty > 1 */}
      {quantity > 1 && (
        <p className="text-xs text-muted-foreground">
          Subtotal for {quantity} items:{' '}
          <span className="font-medium text-foreground">
            {formatPrice(lineTotal)}
          </span>
        </p>
      )}

      {/* Stock hint when approaching the limit */}
      {product.stock <= 5 && (
        <p className="text-xs text-warning">
          Only {product.stock} left in stock
        </p>
      )}
    </div>
  );
}

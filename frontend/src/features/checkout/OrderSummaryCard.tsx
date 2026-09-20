import { formatPrice, gradientFor, initialsFor } from '@/features/products/productVisuals';
import { useCartStore, useCartSubtotal } from '@/features/cart/cart.store';
import { cn } from '@/lib/utils';

/**
 * Read-only order summary shown on the checkout page.
 *
 * Renders from the cart store (no fetches). Same data the drawer shows,
 * but persistent so the user can see what they're paying for while
 * filling the form.
 */
export function OrderSummaryCard() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();

  return (
    <aside className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-base font-medium">Order summary</h2>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => {
          const gradient = gradientFor(item.name);
          const initials = initialsFor(item.name);
          return (
            <li
              key={item.productId}
              className="flex items-center gap-3 py-3"
            >
              <div
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-lg',
                  'bg-gradient-to-br',
                  gradient,
                )}
                aria-hidden="true"
              >
                <span className="font-display text-sm font-medium text-foreground/70">
                  {initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.storeName} · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="font-display text-lg font-semibold tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Shipping and taxes calculated at checkout.
      </p>
    </aside>
  );
}

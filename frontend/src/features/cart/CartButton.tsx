import { ShoppingBag } from 'lucide-react';
import { useCartItemCount } from './cart.store';
import { useCartDrawerStore } from './cartDrawer.store';

/**
 * Header cart icon with item-count badge.
 *
 * The badge only shows when count > 0. Zero-count badges look like
 * notifications and don't add value.
 */
export function CartButton() {
  const count = useCartItemCount();
  const toggle = useCartDrawerStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Open cart${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ShoppingBag className="h-4 w-4" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

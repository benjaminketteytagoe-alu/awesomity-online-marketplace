import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/features/products/productVisuals';
import { useCartStore, useCartSubtotal } from './cart.store';
import { useCartDrawerStore } from './cartDrawer.store';
import { CartLineItem } from './CartLineItem';
import { useAuthStore } from '@/features/auth/auth.store';

/**
 * Slide-in cart drawer.
 *
 * Behaviors implemented (standard e-commerce drawer expectations):
 *   - Escape key closes
 *   - Click on overlay closes
 *   - Body scroll lock while open (otherwise the page behind scrolls)
 *   - Focus is not trapped (out of scope for now; a11y polish in 14.9)
 *
 * The drawer is always mounted but visually hidden/translated when
 * closed. This is intentional — the exit animation plays when isOpen
 * flips to false. If we unmounted on close, the animation wouldn't run.
 *
 * a11y notes:
 *   - role="dialog", aria-modal="true", aria-labelledby pointing to the
 *     heading. This announces it as a modal to screen readers.
 *   - The close button has an accessible label.
 */
export function CartDrawer() {
  const isOpen = useCartDrawerStore((s) => s.isOpen);
  const close = useCartDrawerStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  // ---------- Escape key ----------
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // ---------- Body scroll lock ----------
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleCheckout = () => {
    close();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <h2
              id="cart-drawer-title"
              className="font-display text-lg font-medium tracking-tight"
            >
              Your cart
            </h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-base font-medium">
              Your cart is empty
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add products to your cart to see them here.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                close();
                navigate('/products');
              }}
              className="mt-2"
            >
              Browse products
            </Button>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
            {items.map((item) => (
              <CartLineItem key={item.productId} item={item} />
            ))}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <footer className="border-t border-border px-5 py-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <button
              type="button"
              onClick={close}
              className="mt-2 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

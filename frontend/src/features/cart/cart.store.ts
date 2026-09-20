import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/features/products/product.types';
import type { CartItem } from './cart.types';
import { cartItemCount, cartSubtotal, mergeCartItems } from './cart.utils';

interface CartState {
  items: CartItem[];
  /** Add a product to the cart, or increment quantity if already present. */
  addItem: (product: Product, quantity?: number) => void;
  /** Remove a line entirely. */
  removeItem: (productId: string) => void;
  /** Set the quantity for a line. Clamps to [1, stockAtAddTime]. */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Remove everything. Called on logout and after successful checkout. */
  clear: () => void;
}

/**
 * Cart store.
 *
 * Persistence: Zustand's persist middleware writes `items` to
 * localStorage on every change. On boot, the cart is restored from
 * localStorage automatically. The version field lets us change the
 * persisted shape without breaking existing sessions — if we bump
 * the version, old data is discarded.
 *
 * Why localStorage and not sessionStorage:
 *   A user who closes the tab and comes back later should still have
 *   their cart. sessionStorage would lose it on tab close.
 *
 * Why persist `items` only (not the whole state):
 *   The methods are recreated fresh each boot. Persisting them would
 *   write function references (which don't survive serialization) and
 *   create confusion. Zustand's `partialize` option handles this.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, quantity = 1) =>
        set((state) => {
          // Snapshot the fields we need. Deliberately narrow — we
          // don't persist description, categoryId, timestamps, etc.
          const incoming: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            storeName: product.storeName,
            stockAtAddTime: product.stock,
            quantity: Math.min(
              Math.max(1, quantity),
              Math.max(1, product.stock), // never exceed stock
            ),
          };
          return { items: mergeCartItems(state.items, incoming) };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId !== productId) return item;
            // Clamp: at least 1, at most the stock we knew about.
            const clamped = Math.min(
              Math.max(1, quantity),
              Math.max(1, item.stockAtAddTime),
            );
            return { ...item, quantity: clamped };
          }),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'marketplace.cart',
      version: 1,
      // Only persist `items`. Methods are recreated on each boot.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/* ===================== Derived selectors ===================== */

/**
 * React hook returning the total number of items (sum of quantities).
 * Recomputes when items change. Kept as a hook rather than a plain
 * function so components subscribe to changes automatically.
 */
export function useCartItemCount(): number {
  return useCartStore((state) => cartItemCount(state.items));
}

/**
 * React hook returning the cart's monetary subtotal.
 */
export function useCartSubtotal(): number {
  return useCartStore((state) => cartSubtotal(state.items));
}

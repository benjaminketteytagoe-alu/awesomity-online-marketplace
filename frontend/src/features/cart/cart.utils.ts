import type { CartItem } from './cart.types';

/**
 * Pure helpers for the cart. Exported separately from the store so
 * they're trivially unit-testable and importable from anywhere
 * without pulling in the Zustand runtime.
 */

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Merge the same product added twice. The simplest correct behavior
 * is to sum the quantities. We do NOT replace — if a user adds a
 * product, then goes back and adds it again, they get 2, not 1.
 *
 * The caller is responsible for capping at stock. We accept the
 * merge here because it's a mechanical operation with no policy.
 */
export function mergeCartItems(
  existing: CartItem[],
  incoming: CartItem,
): CartItem[] {
  const index = existing.findIndex(
    (item) => item.productId === incoming.productId,
  );

  if (index === -1) {
    return [...existing, incoming];
  }

  const updated = [...existing];
  const current = updated[index];
  if (!current) return existing; // unreachable given the findIndex guard

  updated[index] = {
    ...current,
    // Cap at stock; if stock changed since add, prefer the smaller.
    quantity: Math.min(
      current.quantity + incoming.quantity,
      current.stockAtAddTime,
    ),
  };
  return updated;
}

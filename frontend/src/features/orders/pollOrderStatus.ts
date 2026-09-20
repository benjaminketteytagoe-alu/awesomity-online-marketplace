import { orderApi } from './order.api';
import type { Order } from './order.types';

/**
 * Poll GET /orders/{id} until the order reaches a terminal state
 * (PAID or CANCELLED). Returns the terminal order on success, null
 * on timeout.
 *
 * Extracted from useCheckoutFlow so PayOrderModal can reuse it. Same
 * behavior in both places: 500ms interval, silent transient errors,
 * give up after the timeout rather than block the UI forever.
 *
 * Why not TanStack Query's refetchInterval:
 *   The polling is action-triggered (right after a payment succeeds),
 *   not view-triggered. It runs for a bounded window, then stops. A
 *   plain async function is clearer than configuring a hook to do the
 *   same thing and tearing it down.
 */
export async function pollUntilPaid(
  orderId: string,
  timeoutMs = 8000,
  intervalMs = 500,
): Promise<Order | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await sleep(intervalMs);
    try {
      const order = await orderApi.byId(orderId);
      if (order.status === 'PAID') return order;
      if (order.status === 'CANCELLED') return order;
    } catch {
      // Transient network error — keep polling until the deadline.
      // If the backend is down for the whole window, we return null
      // and the caller shows a "still processing" message.
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toErrorMessage } from '@/lib/api/client';
import { orderApi } from '@/features/orders/order.api';
import { usePlaceOrder, usePayOrder } from '@/features/orders/order.queries';
import type { PayOrderRequest } from '@/features/orders/order.types';
import { useCartStore } from '@/features/cart/cart.store';
import type { CartItem } from '@/features/cart/cart.types';

/**
 * The state machine for a checkout attempt.
 *
 *   idle       — form is interactive, button says "Place order"
 *   placing    — POST /orders in flight
 *   paying     — POST /orders/{id}/pay in flight
 *   confirming — payment accepted, polling for the async PAID transition
 *
 * On any failure we return to idle with an error message; the cart is
 * untouched so the user can retry without re-adding items.
 */
export type CheckoutFlowState = 'idle' | 'placing' | 'paying' | 'confirming';

interface UseCheckoutFlowResult {
  state: CheckoutFlowState;
  error: string | null;
  submit: (items: CartItem[], payment: PayOrderRequest) => Promise<void>;
  isSubmitting: boolean;
  /** Human-readable label for the submit button based on current state. */
  submitLabel: string;
}

export function useCheckoutFlow(): UseCheckoutFlowResult {
  const [state, setState] = useState<CheckoutFlowState>('idle');
  const [error, setError] = useState<string | null>(null);
  const placeOrder = usePlaceOrder();
  const payOrder = usePayOrder();
  const clearCart = useCartStore((s) => s.clear);
  const navigate = useNavigate();

  // Prevents double-submit. React state isn't enough here because two
  // clicks can land before the state update renders.
  const inFlightRef = useRef(false);

  const submit = useCallback(
    async (items: CartItem[], payment: PayOrderRequest) => {
      if (inFlightRef.current) return;
      if (items.length === 0) {
        setError('Your cart is empty.');
        return;
      }
      inFlightRef.current = true;
      setError(null);

      try {
        // ---------- Step 1: place order ----------
        setState('placing');
        const placed = await placeOrder.mutateAsync({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });

        // ---------- Step 2: pay ----------
        setState('paying');
        const paymentResult = await payOrder.mutateAsync({
          orderId: placed.orderId,
          payload: payment,
        });

        // Mock PSP can return SUCCESS or FAILED here. Both are HTTP 200,
        // so we branch on the payload, not on the request outcome.
        if (paymentResult.status === 'FAILED') {
          setError(
            paymentResult.message ||
              'Payment was declined. Please check your details and try again.',
          );
          setState('idle');
          return;
        }

        // ---------- Step 3: confirm (poll for async PAID) ----------
        setState('confirming');
        const confirmed = await pollUntilPaid(placed.orderId, 8000);

        // ---------- Step 4: clear cart and redirect ----------
        clearCart();

        if (confirmed) {
          toast.success('Order confirmed');
        } else {
          // The order exists and was paid, but the async consumer
          // hasn't marked it PAID yet. We redirect anyway so the user
          // isn't stuck on the checkout screen.
          toast.message('Order placed', {
            description:
              'Confirmation is still processing. Refresh in a moment to see the latest status.',
          });
        }

        navigate(`/orders/${placed.orderId}`, { replace: true });
      } catch (err) {
        setError(toErrorMessage(err));
        setState('idle');
      } finally {
        inFlightRef.current = false;
      }
    },
    [placeOrder, payOrder, clearCart, navigate],
  );

  const submitLabel = (() => {
    switch (state) {
      case 'placing':    return 'Placing order…';
      case 'paying':     return 'Processing payment…';
      case 'confirming': return 'Confirming your order…';
      default:           return 'Place order';
    }
  })();

  return {
    state,
    error,
    submit,
    isSubmitting: state !== 'idle',
    submitLabel,
  };
}

/**
 * Poll GET /orders/{id} until status is PAID (or CANCELLED — a terminal
 * state we can stop on). Returns true if the order reached a terminal
 * state within the timeout, false otherwise.
 *
 * Why a hand-rolled loop instead of TanStack Query's refetchInterval:
 *   - The polling is triggered by a specific user action, not by
 *     mounting a component.
 *   - We want to stop the moment a condition is met, not on a timer.
 *   - The result is used inline (to decide the toast message and
 *     whether to keep waiting), not stored in the cache.
 *   A single async function is clearer than configuring a query hook
 *   to do the same thing and then tearing it down.
 */
async function pollUntilPaid(
  orderId: string,
  timeoutMs: number,
): Promise<boolean> {
  const start = Date.now();
  const intervalMs = 500;

  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      const order = await orderApi.byId(orderId);
      if (order.status === 'PAID') return true;
      if (order.status === 'CANCELLED') return true; // terminal
    } catch {
      // Transient — keep polling until the deadline. If the backend
      // is down for the whole 8s, we'll fall through to `false` and
      // the user gets the "still processing" message. That's honest.
    }
  }
  return false;
}

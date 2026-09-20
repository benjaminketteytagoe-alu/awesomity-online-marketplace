import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { Page } from '@/lib/api/types';
import { orderApi } from './order.api';
import { productKeys } from '@/features/products/product.queries';
import type {
  Order,
  OrderSummary,
  PayOrderRequest,
  PaymentResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from './order.types';

/**
 * Query keys for orders. Same factory pattern as products and
 * categories, so invalidations are greppable and reliable.
 *
 *   ['orders', 'list', {page,size}]  — paginated history
 *   ['orders', 'detail', id]          — single order
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: { page?: number; size?: number }) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

/* ===================== Queries ===================== */

/**
 * Paginated order history for the current shopper.
 *
 * Short stale time because a shopper who just placed an order expects
 * to see it in the list immediately. Mutations also explicitly
 * invalidate this key, so 30s is a safety net, not the primary
 * freshness mechanism.
 */
export function useOrders(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Page<OrderSummary>> {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderApi.list(params),
    staleTime: 30_000,
  });
}

/**
 * Single order detail. `enabled: !!id` guards against firing with an
 * empty id during route transitions.
 *
 * `refetchInterval` is intentionally NOT set here. The payment page
 * will pass a `refetchInterval` override when it's actively polling
 * for the async PAID transition. Other usages get plain fetch-once
 * behavior.
 */
export function useOrder(id: string | undefined): UseQueryResult<Order> {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => orderApi.byId(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/* ===================== Mutations ===================== */

/**
 * Place an order.
 *
 * Invalidation strategy:
 *   - orderKeys.lists()  — the new PENDING order appears at the top
 *     of the history list on the next visit
 *
 * We do NOT invalidate productKeys here — placing an order does not
 * change stock (that happens on payment success). This is a subtle
 * but important distinction.
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation<PlaceOrderResponse, Error, PlaceOrderRequest>({
    mutationFn: (payload) => orderApi.place(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Cancel an order.
 *
 * Invalidation strategy:
 *   - orderKeys.detail(id)  — status changes to CANCELLED
 *   - orderKeys.lists()     — summary row updates
 *   - productKeys.all       — stock may have been restored (PAID
 *     cancellations restore stock on the backend)
 *
 * The product invalidation matters because product cards show stock
 * badges. After cancelling a paid order, those badges are stale until
 * we refetch.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, string>({
    mutationFn: (orderId) => orderApi.cancel(orderId),
    onSuccess: (_order, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Pay for an order.
 *
 * Invalidation strategy:
 *   - orderKeys.detail(id)  — status will move PENDING → PAID once
 *     the async consumer runs
 *   - orderKeys.lists()
 *   - productKeys.all       — stock decrements on the backend side
 *
 * IMPORTANT: the payment endpoint returns as soon as the mock PSP
 * charges. The order transition to PAID happens asynchronously via
 * RabbitMQ, so the invalidated queries may refetch and still see
 * PENDING. Callers that need to observe the transition should poll
 * /api/orders/{id} with a short interval until the status changes.
 */
export function usePayOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    PaymentResponse,
    Error,
    { orderId: string; payload: PayOrderRequest }
  >({
    mutationFn: ({ orderId, payload }) => orderApi.pay(orderId, payload),
    onSuccess: (_payment, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

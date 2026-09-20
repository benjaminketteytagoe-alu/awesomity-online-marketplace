import { api } from '@/lib/api/client';
import type { Page } from '@/lib/api/types';
import type {
  Order,
  OrderSummary,
  PayOrderRequest,
  PaymentResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from './order.types';

/**
 * Order API client.
 *
 * Same separation as productApi and categoryApi: this layer knows
 * nothing about TanStack Query. Plain promises in, plain promises out.
 * Query hooks wrap these calls.
 *
 * All endpoints require an authenticated shopper. The axios interceptor
 * attaches the JWT automatically; if the token is missing/expired, the
 * interceptor tries a silent refresh first, then bubbles a 401.
 */
export const orderApi = {
  /**
   * POST /api/orders
   * Creates a PENDING order. Does NOT trigger payment, stock decrement,
   * or email — those happen when /pay succeeds.
   */
  async place(payload: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const { data } = await api.post<PlaceOrderResponse>(
      '/api/orders',
      payload,
    );
    return data;
  },

  /**
   * GET /api/orders?page=0&size=20
   * Returns a Spring Data Page<OrderSummary> for the current shopper.
   * The backend defaults to size=20; we pass explicit params to be
   * able to paginate from the UI.
   */
  async list(params: { page?: number; size?: number } = {}): Promise<
    Page<OrderSummary>
  > {
    const query: Record<string, number> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.size !== undefined) query.size = params.size;

    const { data } = await api.get<Page<OrderSummary>>('/api/orders', {
      params: query,
    });
    return data;
  },

  /**
   * GET /api/orders/{id}
   * Returns full order detail including line items. Throws 404 if the
   * order does not exist; 403 if it belongs to a different shopper.
   */
  async byId(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/api/orders/${id}`);
    return data;
  },

  /**
   * PATCH /api/orders/{id}/cancel
   * Only allowed while PENDING or PAID. Restores stock on PAID
   * cancellations (the backend handles this transactionally).
   */
  async cancel(id: string): Promise<Order> {
    const { data } = await api.patch<Order>(`/api/orders/${id}/cancel`);
    return data;
  },

  /**
   * POST /api/orders/{id}/pay
   * Dispatches to the mock PSP (card or mobile money). On success, the
   * backend publishes OrderPlaced to RabbitMQ, which asynchronously
   * decrements stock, marks the order PAID, and emails the shopper
   * and seller.
   *
   * IMPORTANT: the response reflects the payment attempt, not the
   * final order state. The order may still be PENDING when the HTTP
   * response arrives, because the async consumer hasn't run yet. The
   * UI should poll /api/orders/{id} after a successful payment to see
   * the transition to PAID.
   */
  async pay(orderId: string, payload: PayOrderRequest): Promise<PaymentResponse> {
    const { data } = await api.post<PaymentResponse>(
      `/api/orders/${orderId}/pay`,
      payload,
    );
    return data;
  },
};

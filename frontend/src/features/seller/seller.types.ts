/**
 * Seller-feature types.
 *
 * REUSE FIRST: response shapes for orders, order summaries, and
 * products are identical between the buyer and seller views. We
 * import them from their original homes rather than redeclaring
 * here — a second OrderStatus type would drift from the first.
 *
 * This file declares only the shapes the seller feature *owns*:
 * request payloads and any seller-specific envelopes.
 */

import type { Order, OrderSummary, OrderStatus } from '@/features/orders/order.types';
import type { Product } from '@/features/products/product.types';

/* ===================== Request payloads ===================== */

/**
 * POST /api/seller/products
 *
 * Backend constraints (from CreateProductRequest.java):
 *   - name: @NotBlank, 2-200 chars
 *   - description: <=5000 chars, optional
 *   - price: @NotNull, >= 0.00, up to 10 integer digits, 2 fraction
 *   - stock: @NotNull, >= 0
 *   - categoryId: @NotNull UUID
 */
export interface CreateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: string;
}

/**
 * PATCH /api/seller/products/{id}
 *
 * Backend: every field is optional. Null = leave unchanged. In the
 * frontend edit form we always send every field (simplest correct
 * behavior), which means "clear a field" doesn't work as a way to
 * blank a value. Acceptable trade-off; noted.
 */
export type UpdateProductRequest = Partial<CreateProductRequest>;

/**
 * PATCH /api/seller/orders/{id}/status
 *
 * Backend takes a bare string. The valid seller transitions are
 * enforced by nextSellerStatus() on the frontend and by
 * validateSellerTransition on the backend.
 *
 * We narrow the type to only the three statuses a seller can set.
 * Trying to send 'PAID' or 'CANCELLED' would be a compile error.
 */
export interface UpdateOrderStatusRequest {
  status: Extract<OrderStatus, 'PROCESSING' | 'SHIPPED' | 'DELIVERED'>;
}

/* ===================== Response shapes ===================== */

// Re-export for convenience — the seller pages import from this
// module so call sites don't need to know which original feature
// file each type lives in.
export type { Order, OrderSummary, OrderStatus, Product };

/**
 * Seller ping response. Documented here even though the frontend
 * doesn't currently call it — it's the sanity-check endpoint that
 * proves the JWT is a seller token.
 */
export interface SellerPingResponse {
  ok: boolean;
  scope: string;
}

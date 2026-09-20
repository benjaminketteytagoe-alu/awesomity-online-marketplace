/**
 * Order and payment domain types.
 *
 * Derived verbatim from the backend Java DTOs:
 *   - OrderStatus.java               (enum)
 *   - OrderSummary.java              (list item)
 *   - OrderResponse.java             (detail)
 *   - OrderItemResponse.java         (line item)
 *   - PlaceOrderRequest.java         (create)
 *   - PlaceOrderResponse.java        (create response)
 *   - PaymentMethod.java             (enum)
 *   - PaymentStatus.java             (enum)
 *   - PaymentResponse.java           (pay response)
 *   - PayOrderRequest.java           (polymorphic pay request)
 *
 * Every field name and constraint in this file comes from the backend
 * source, not from inference. When the backend changes, this file is
 * the first thing to update.
 */

/* ===================== Enums ===================== */

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'MOBILE_MONEY';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/* ===================== Order responses ===================== */

/**
 * One line item on an order. Note that productName and storeName are
 * denormalized into the response — the order detail page can render
 * without fetching products or stores.
 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * A row in the order history list. Deliberately smaller than
 * OrderDetail — no items, no shopper name. Enough to render a
 * table row and click through to the detail page.
 */
export interface OrderSummary {
  id: string;
  shopperId: string;
  shopperEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

/**
 * Full order detail. Returned by GET /api/orders/{id} and also from
 * PATCH /api/orders/{id}/cancel.
 */
export interface Order {
  id: string;
  shopperId: string;
  shopperEmail: string;
  shopperName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/* ===================== Place order ===================== */

/**
 * Request body for POST /api/orders.
 *
 * Backend constraints:
 *   - items: @NotEmpty, @Valid
 *   - item.productId: @NotNull
 *   - item.quantity: @Min(1) @Max(100)
 */
export interface PlaceOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

/**
 * Response for POST /api/orders. A stub — to get the full order,
 * follow up with GET /api/orders/{orderId}.
 *
 * Note the field name: `orderId`, not `id`. Different from
 * OrderSummary/Order where the primary key is `id`. Copied verbatim
 * from the Java record.
 */
export interface PlaceOrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  message: string;
}

/* ===================== Payment ===================== */

/**
 * Card-specific details. All four fields are required by the backend.
 *
 * Constraints (from @Pattern annotations on PayOrderRequest.CardDetails):
 *   - number:   ^[0-9 ]{12,19}$    digits and spaces
 *   - expiry:   ^(0[1-9]|1[0-2])/[0-9]{2}$   MM/YY
 *   - cvv:      ^[0-9]{3,4}$       3 or 4 digits
 *   - holderName: 2-100 chars
 */
export interface CardDetails {
  number: string;
  expiry: string;   // "MM/YY"
  cvv: string;
  holderName: string;
}

/**
 * Mobile money details. Provider must be MTN or AIRTEL.
 *
 * Constraints:
 *   - phone:    ^\+?[0-9]{9,15}$   9-15 digits, optional leading +
 *   - provider: MTN | AIRTEL
 */
export interface MobileMoneyDetails {
  phone: string;
  provider: 'MTN' | 'AIRTEL';
}

/**
 * Payment request — polymorphic, discriminated by `method`.
 *
 * The backend uses Jackson's EXISTING_PROPERTY discrimination: the
 * `method` field is both the discriminator AND a field on the payload.
 * Our axios request must send it explicitly. We model this as a
 * discriminated union so TypeScript enforces the shape.
 */
export type PayOrderRequest =
  | { method: 'CARD';         card: CardDetails }
  | { method: 'MOBILE_MONEY'; mobileMoney: MobileMoneyDetails };

/**
 * Response for POST /api/orders/{id}/pay.
 *
 * The message field is human-readable and already user-appropriate —
 * the backend says "Payment accepted..." on success and something like
 * "Card declined by issuer" on failure. We render it directly.
 */
export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  message: string;
  createdAt: string;
}

/* ===================== UI helpers ===================== */

/**
 * Order status → display label. Centralized so all surfaces use the
 * same wording. If the backend adds a status, TypeScript will complain
 * until this map is updated (Record<OrderStatus, string> requires
 * exhaustiveness).
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:    'Awaiting payment',
  PAID:       'Paid',
  PROCESSING: 'Processing',
  SHIPPED:    'Shipped',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
};

/**
 * Order status → Tailwind color classes for a badge. Same intent as
 * the stock badge on product cards: semantic color, consistent across
 * the app.
 *
 * Success green for delivered, brand blue for the active flow, muted
 * gray for cancelled.
 */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING:    'bg-warning/10 text-warning',
  PAID:       'bg-success/10 text-success',
  PROCESSING: 'bg-brand/10 text-brand',
  SHIPPED:    'bg-brand/10 text-brand',
  DELIVERED:  'bg-success/10 text-success',
  CANCELLED:  'bg-muted text-muted-foreground',
};

/**
 * Can the shopper cancel this order? Backend rule (OrderService.cancelByShopper):
 * only PENDING or PAID. Mirroring the rule in the frontend prevents
 * "cancel" buttons that would 400.
 */
export function canShopperCancel(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PAID';
}

/**
 * Can the shopper pay this order? Only PENDING orders accept payment
 * (OrderService.pay: `if (order.getStatus() != PENDING) throw ConflictException`).
 */
export function canShopperPay(status: OrderStatus): boolean {
  return status === 'PENDING';
}

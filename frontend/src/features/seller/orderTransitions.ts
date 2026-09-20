import type { OrderStatus } from '@/features/orders/order.types';

/**
 * Seller order status transitions.
 *
 * Mirrors the backend rule in OrderService.validateSellerTransition:
 *   PAID       -> PROCESSING
 *   PROCESSING -> SHIPPED
 *   SHIPPED    -> DELIVERED
 *   any other  -> not allowed
 *
 * Encoding this rule on the frontend means the seller UI only ever
 * offers the one valid next action — no invalid-transition errors
 * ever reach the user. The backend still validates; we just don't
 * give the user a way to violate it.
 */

/**
 * The next status the seller can transition to, or null if the order
 * is in a terminal or non-seller-controllable state.
 */
export function nextSellerStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'PAID':       return 'PROCESSING';
    case 'PROCESSING': return 'SHIPPED';
    case 'SHIPPED':    return 'DELIVERED';
    default:           return null;
  }
}

/**
 * Human-readable label for the action button. Instead of "Advance
 * status" we name the actual next step: "Mark as processing",
 * "Mark as shipped", "Mark as delivered". Users know exactly what
 * the button will do.
 */
export function actionLabelFor(next: OrderStatus): string {
  switch (next) {
    case 'PROCESSING': return 'Start processing';
    case 'SHIPPED':    return 'Mark as shipped';
    case 'DELIVERED':  return 'Mark as delivered';
    default:           return 'Advance status';
  }
}

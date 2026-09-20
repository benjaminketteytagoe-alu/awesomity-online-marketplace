import { ORDER_STATUS_LABEL, type OrderStatus } from './order.types';

/**
 * Pure helpers for rendering an order's status progression.
 *
 * The visual timeline is derived from a single pure function so it's
 * testable without a renderer and the component becomes trivial.
 */

export type StepState = 'done' | 'current' | 'upcoming';

export interface TimelineStep {
  status: OrderStatus;
  label: string;
  state: StepState;
}

/**
 * The normal (non-cancelled) progression. Cancelled is handled
 * separately because it branches from any of PENDING/PAID.
 */
const HAPPY_PATH: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

/**
 * Compute the timeline steps for an order in a given status.
 *
 * Normal orders: five steps, with `current` marking where the order is.
 * Cancelled orders: two steps — "Order placed" (done) and "Cancelled"
 * (current). Showing the full five-step sequence with four unreached
 * steps for a cancelled order would be misleading.
 */
export function statusSteps(current: OrderStatus): TimelineStep[] {
  if (current === 'CANCELLED') {
    return [
      { status: 'PENDING', label: 'Order placed', state: 'done' },
      { status: 'CANCELLED', label: 'Cancelled', state: 'current' },
    ];
  }

  const currentIndex = HAPPY_PATH.indexOf(current);
  // If status is not on the happy path (shouldn't happen), treat as
  // the first step being current. Defensive, not paranoid.
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return HAPPY_PATH.map((status, i) => ({
    status,
    label: ORDER_STATUS_LABEL[status],
    state: i < safeIndex ? 'done' : i === safeIndex ? 'current' : 'upcoming',
  }));
}

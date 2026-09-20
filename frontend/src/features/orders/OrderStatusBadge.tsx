import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from './order.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Status pill for an order. Colors and labels come from centralized
 * maps in order.types.ts so every surface shows the same thing.
 *
 * Note: the class strings in ORDER_STATUS_BADGE use the `/10` alpha
 * convention (e.g. 'bg-success/10') — subtle tinted backgrounds with
 * a saturated text color. This reads as a status pill, not a solid
 * button, and works in both light and dark mode.
 */
export function OrderStatusBadge({
  status,
  size = 'md',
  className,
}: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px] uppercase tracking-wide'
          : 'px-2.5 py-1 text-xs',
        ORDER_STATUS_BADGE[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

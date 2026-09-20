import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/features/products/productVisuals';
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge';
import { useForceOrderStatus } from './admin.queries';
import { toErrorMessage } from '@/lib/api/client';
import type { OrderStatus, OrderSummary } from './admin.types';

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

interface AdminOrderRowProps {
  order: OrderSummary;
}

/**
 * One order row in the admin orders list.
 *
 * The status is directly editable via a dropdown — this is the god-mode
 * lever. The backend's AdminOrderController.forceStatus accepts any
 * status → any other status without validating the seller's transition
 * rules. On success, useForceOrderStatus invalidates adminKeys.orders.*,
 * orderKeys.*, and sellerKeys.orders.* so all three views (admin,
 * shopper, seller) refresh.
 */
export function AdminOrderRow({ order }: AdminOrderRowProps) {
  const mutation = useForceOrderStatus();

  const handleStatusChange = async (next: OrderStatus) => {
    if (next === order.status) return;
    try {
      await mutation.mutateAsync({
        id: order.id,
        payload: { status: next },
      });
      toast.success(`Order set to ${next}`);
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
      {/* Order identity */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-muted-foreground">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="mt-1 text-sm font-medium">
          {formatDate(order.createdAt)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {order.shopperEmail}
        </p>
      </div>

      {/* Amount */}
      <div className="hidden text-right sm:block">
        <p className="font-display text-base font-semibold tabular-nums">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      {/* Current status */}
      <div className="shrink-0">
        <OrderStatusBadge status={order.status} />
      </div>

      {/* God-mode status dropdown */}
      <div className="relative shrink-0">
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          disabled={mutation.isPending}
          aria-label={`Change status for order ${order.id.slice(0, 8)}`}
          className={cn(
            'h-9 rounded-lg border border-border bg-surface px-2 pr-7 text-xs font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {mutation.isPending && (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Detail link */}
      <Link
        to={`/orders/${order.id}`}
        className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        View
      </Link>
    </article>
  );
}

/* ---------------- helpers ---------------- */

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

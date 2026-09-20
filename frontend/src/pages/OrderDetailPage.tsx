import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  formatPrice,
  gradientFor,
  initialsFor,
} from '@/features/products/productVisuals';
import { useOrder, useCancelOrder } from '@/features/orders/order.queries';
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge';
import { OrderTimeline } from '@/features/orders/OrderTimeline';
import { PayOrderModal } from '@/features/orders/PayOrderModal';
import {
  canShopperCancel,
  canShopperPay,
} from '@/features/orders/order.types';
import { toErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/**
 * Full order detail page.
 *
 * Layout:
 *   - Left: line items + timeline
 *   - Right: order meta + actions
 *
 * Actions are status-gated using the helpers from order.types.ts.
 * Users never see a button that would 4xx — cancel is only shown
 * for PENDING/PAID, pay only for PENDING.
 */
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOrder(id);
  const cancelOrder = useCancelOrder();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  /* ---------- Loading ---------- */
  if (query.isLoading) {
    return (
      <div className="container py-8">
        <div
          className="space-y-4"
          role="status"
          aria-label="Loading order"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-96 animate-pulse rounded-xl bg-muted/50" />
            <div className="h-96 animate-pulse rounded-xl bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Error / Not found ---------- */
  if (query.isError) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="font-display text-lg font-medium">
            Order not found
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {toErrorMessage(query.error)}
          </p>
          <Link to="/orders" className="mt-2">
            <Button variant="secondary">Back to orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!query.data) return null;
  const order = query.data;

  const canPay = canShopperPay(order.status);
  const canCancel = canShopperCancel(order.status);

  const handleCancel = () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    cancelOrder.mutate(order.id, {
      onSuccess: () => toast.success('Order cancelled'),
      onError: (err) => toast.error(toErrorMessage(err)),
    });
  };

  const created = new Date(order.createdAt);
  const updated = new Date(order.updatedAt);

  return (
    <div className="container py-8">
      {/* Back + header */}
      <Link
        to="/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(created)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------- Left: items ---------- */}
        <section className="rounded-xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-medium">
              Items ({order.items.length})
            </h2>
          </header>

          <ul className="divide-y divide-border">
            {order.items.map((item) => {
              const gradient = gradientFor(item.productName);
              const initials = initialsFor(item.productName);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Link
                    to={`/products/${item.productId}`}
                    className={cn(
                      'grid h-14 w-14 shrink-0 place-items-center rounded-lg',
                      'bg-gradient-to-br',
                      gradient,
                    )}
                    aria-label={`View ${item.productName}`}
                  >
                    <span className="font-display text-base font-medium text-foreground/70">
                      {initials}
                    </span>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="line-clamp-1 text-sm font-medium hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.storeName} · Qty {item.quantity} ·{' '}
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>

                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              );
            })}
          </ul>

          <footer className="flex items-baseline justify-between border-t border-border px-5 py-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-xl font-semibold tabular-nums">
              {formatPrice(order.totalAmount)}
            </span>
          </footer>
        </section>

        {/* ---------- Right: timeline + meta + actions ---------- */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Timeline */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 font-display text-base font-medium">
              Progress
            </h2>
            <OrderTimeline status={order.status} />
          </section>

          {/* Meta */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-display text-base font-medium">
              Details
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd className="font-mono text-xs">
                  {order.id.slice(0, 12)}…
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Placed</dt>
                <dd>{formatDateTime(created)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last update</dt>
                <dd>{formatDateTime(updated)}</dd>
              </div>
            </dl>
          </section>

          {/* Actions */}
          {(canPay || canCancel) && (
            <section className="flex flex-col gap-2">
              {canPay && (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setIsPayModalOpen(true)}
                >
                  Pay now
                </Button>
              )}
              {canCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleCancel}
                  disabled={cancelOrder.isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                  {cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
                </Button>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Pay modal */}
      <PayOrderModal
        orderId={order.id}
        totalAmount={order.totalAmount}
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => query.refetch()}
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

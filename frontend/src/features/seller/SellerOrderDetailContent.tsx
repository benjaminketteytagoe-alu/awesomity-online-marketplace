import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, User, ShoppingBag } from 'lucide-react';
import { formatPrice, gradientFor, initialsFor } from '@/features/products/productVisuals';
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge';
import { OrderTimeline } from '@/features/orders/OrderTimeline';
import { useSellerOrder } from './seller.queries';
import { SellerOrderStatusAction } from './SellerOrderStatusAction';
import { toErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/**
 * Seller order detail page.
 *
 * Shows the order scoped to the seller's items — the backend filters
 * out items belonging to other stores. So a seller looking at a
 * multi-store order sees only their slice.
 *
 * The `totalAmount` field on the OrderResponse is the FULL order
 * total, not the seller's share. We compute the seller subtotal
 * from the (filtered) items so both figures are visible and clearly
 * labeled.
 */
export function SellerOrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const query = useSellerOrder(id);

  /* ---------- Loading ---------- */
  if (query.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading order">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-96 animate-pulse rounded-xl bg-muted/50" />
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (query.isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          {toErrorMessage(query.error)}
        </p>
        <Link to="/seller/orders" className="mt-3 inline-block">
          <span className="text-sm text-foreground underline">
            Back to orders
          </span>
        </Link>
      </div>
    );
  }

  if (!query.data) return null;
  const order = query.data;

  // The seller's subtotal — sum of their items only.
  const sellerSubtotal = order.items.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  const created = new Date(order.createdAt);

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        to="/seller/orders"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {formatDateTime(created)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------- Left: items ---------- */}
        <section className="rounded-xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-medium">
              Your items ({order.items.length})
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
                  <div
                    className={cn(
                      'grid h-14 w-14 shrink-0 place-items-center rounded-lg',
                      'bg-gradient-to-br',
                      gradient,
                    )}
                    aria-hidden="true"
                  >
                    <span className="font-display text-base font-medium text-foreground/70">
                      {initials}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty {item.quantity} · {formatPrice(item.unitPrice)} each
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
            <span className="text-sm text-muted-foreground">
              Your subtotal
            </span>
            <span className="font-display text-xl font-semibold tabular-nums">
              {formatPrice(sellerSubtotal)}
            </span>
          </footer>
        </section>

        {/* ---------- Right: buyer, timeline, action ---------- */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Buyer info */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-display text-base font-medium">
              Buyer
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.shopperName}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{order.shopperEmail}</span>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 font-display text-base font-medium">
              Progress
            </h2>
            <OrderTimeline status={order.status} />
          </section>

          {/* Status action — only when there's a valid next step */}
          <SellerOrderStatusAction
            orderId={order.id}
            currentStatus={order.status}
          />
        </div>
      </div>
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

// Suppress unused import warning — ShoppingBag is kept for future
// use when we want to add per-row item counts on the list.
void ShoppingBag;

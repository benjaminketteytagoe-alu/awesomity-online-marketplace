import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/features/products/productVisuals';
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge';
import { useSellerOrders } from './seller.queries';
import { toErrorMessage } from '@/lib/api/client';

const PAGE_SIZE = 10;

/**
 * Seller's orders list.
 *
 * URL-driven pagination (?page=2) plus a client-side "Awaiting
 * action" filter for orders in PAID status — the ones the seller
 * actually needs to act on.
 *
 * Why client-side filtering:
 *   The backend's seller/orders endpoint doesn't accept a status
 *   filter. Adding one would be a backend change. For now we filter
 *   the current page client-side, which covers the common case
 *   (actionable orders are the most recent, hence on page 1).
 *   Flagged for later: if a seller has hundreds of orders, we'll
 *   want server-side filtering.
 */
export function SellerOrdersContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);
  const onlyActionable = searchParams.get('filter') === 'actionable';

  const query = useSellerOrders({ page: apiPage, size: PAGE_SIZE });

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next === 1) {
      params.delete('page');
    } else {
      params.set('page', String(next));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (onlyActionable) {
      params.delete('filter');
    } else {
      params.set('filter', 'actionable');
    }
    // Reset to page 1 when the filter changes
    params.delete('page');
    setSearchParams(params);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFilter}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            onlyActionable
              ? 'bg-warning/15 text-warning'
              : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {onlyActionable ? '✓ ' : ''}Awaiting action
        </button>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div
          className="space-y-3"
          role="status"
          aria-label="Loading orders"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {query.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {toErrorMessage(query.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && (() => {
        const orders = query.data.content;
        const filtered = onlyActionable
          ? orders.filter((o) => o.status === 'PAID')
          : orders;

        if (orders.length === 0) {
          return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-display text-base font-medium">
                No orders yet
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                When shoppers buy your products, orders will appear here.
              </p>
            </div>
          );
        }

        if (onlyActionable && filtered.length === 0) {
          return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
              <h3 className="font-display text-base font-medium">
                All caught up
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                No orders on this page need your attention right now.
              </p>
            </div>
          );
        }

        return (
          <>
            <ul className="space-y-3">
              {filtered.map((order) => (
                <li key={order.id}>
                  <SellerOrderRow order={order} />
                </li>
              ))}
            </ul>

            {query.data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={query.data.first}
                  onClick={() => handlePageChange(urlPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {urlPage} of {query.data.totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={query.data.last}
                  onClick={() => handlePageChange(urlPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

/* ---------------- Row ---------------- */

function SellerOrderRow({
  order,
}: {
  order: import('./seller.types').OrderSummary;
}) {
  const created = new Date(order.createdAt);
  return (
    <Link
      to={`/seller/orders/${order.id}`}
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4',
        'transition-colors hover:border-foreground/20 hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-muted-foreground">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="mt-1 text-sm font-medium">
          {formatOrderDate(created)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {order.shopperEmail}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="font-display text-base font-semibold tabular-nums">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      <div className="shrink-0">
        <OrderStatusBadge status={order.status} />
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/* ---------------- helpers ---------------- */

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatOrderDate(date: Date): string {
  return dateFormatter.format(date);
}

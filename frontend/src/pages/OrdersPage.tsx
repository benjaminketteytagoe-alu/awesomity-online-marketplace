import { Link, useSearchParams } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOrders } from '@/features/orders/order.queries';
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge';
import { formatPrice } from '@/features/products/productVisuals';
import { toErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

/**
 * Order history list for the current shopper.
 *
 * URL-driven pagination — same pattern as /products. The page is
 * shareable and refresh-safe: /orders?page=2 shows page 2 on load.
 *
 * We show cards, not a table. Why:
 *   - Mobile: cards wrap gracefully, tables need horizontal scroll
 *   - Visual weight: each order feels like a distinct event, not a row
 *   - Extensible: we can add product thumbnails later without columns
 */
export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1-indexed page in URL, 0-indexed for the API — same convention as
  // products. The translation is local to this page.
  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);

  const query = useOrders({ page: apiPage, size: PAGE_SIZE });

  const handlePageChange = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(next));
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Your orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage orders you've placed.
        </p>
      </header>

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
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/50"
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
            onClick={() => query.refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {query.isSuccess && query.data.content.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium text-foreground">
            No orders yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            When you place your first order, it will show up here.
          </p>
          <Link to="/products" className="mt-2">
            <Button variant="secondary">Browse products</Button>
          </Link>
        </div>
      )}

      {/* Success: list of orders */}
      {query.isSuccess && query.data.content.length > 0 && (
        <>
          <ul className="space-y-3">
            {query.data.content.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </ul>

          {/* Pagination — only shown when there is more than one page */}
          {query.data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between gap-4">
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
      )}
    </div>
  );
}

/* ---------------- Order row ---------------- */

function OrderRow({
  order,
}: {
  order: import('@/features/orders/order.types').OrderSummary;
}) {
  const created = new Date(order.createdAt);

  return (
    <Link
      to={`/orders/${order.id}`}
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4',
        'transition-colors hover:border-foreground/20 hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      {/* Left: order id + date */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-muted-foreground">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="mt-1 text-sm font-medium">
          {formatOrderDate(created)}
        </p>
      </div>

      {/* Middle: amount */}
      <div className="hidden text-right sm:block">
        <p className="font-display text-base font-semibold tabular-nums">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      {/* Right: status badge */}
      <div className="shrink-0">
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Chevron */}
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

/**
 * Human-readable date for the order list. We use Intl.DateTimeFormat
 * for locale awareness — a user in the UK sees "20 Sep 2026", a user
 * in the US sees "Sep 20, 2026". No manual formatting, no timezone
 * bugs.
 */
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatOrderDate(date: Date): string {
  return dateFormatter.format(date);
}

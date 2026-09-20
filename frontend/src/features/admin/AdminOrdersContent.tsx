import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdminOrders } from './admin.queries';
import { AdminOrderRow } from './AdminOrderRow';
import { toErrorMessage } from '@/lib/api/client';
import type { OrderStatus } from './admin.types';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/**
 * Admin orders oversight.
 *
 * Paginated list with a status filter dropdown (server-side, backend
 * accepts ?status=). Each row has a god-mode status dropdown.
 */
export function AdminOrdersContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = (searchParams.get('status') as OrderStatus | null) ?? '';
  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);

  const query = useAdminOrders({
    status: statusParam || undefined,
    page: apiPage,
    size: PAGE_SIZE,
  });

  const setStatusFilter = (status: '' | OrderStatus) => {
    const next = new URLSearchParams(searchParams);
    if (!status) next.delete('status');
    else next.set('status', status);
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next === 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="order-status-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Status:
        </label>
        <select
          id="order-status-filter"
          value={statusParam}
          onChange={(e) => setStatusFilter(e.target.value as '' | OrderStatus)}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'ALL'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading orders">
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

      {/* Empty */}
      {query.isSuccess && query.data.content.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">
            No orders match this filter
          </h3>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && query.data.content.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {query.data.totalElements.toLocaleString()}{' '}
            {query.data.totalElements === 1 ? 'order' : 'orders'}
          </p>

          <ul className="space-y-3">
            {query.data.content.map((order) => (
              <li key={order.id}>
                <AdminOrderRow order={order} />
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
                <ChevronLeft className="h-3.5 w-3.5" />
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
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

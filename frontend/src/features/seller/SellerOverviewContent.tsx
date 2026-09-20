import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSellerProducts } from './seller.queries';
import { useSellerOrders } from './seller.queries';
import { SellerStatCard } from './SellerStatCard';
import { toErrorMessage } from '@/lib/api/client';

/**
 * The seller's dashboard overview.
 *
 * Five numbers, derived from the seller's products and orders
 * queries. We don't have a dedicated stats endpoint on the backend,
 * so we compute from the list queries:
 *
 *   - products:      totalElements from a size=1 fetch
 *   - orders:        totalElements from a size=1 fetch
 *   - awaiting:      count of orders with status PAID / PROCESSING / SHIPPED
 *   - delivered:     count of orders with status DELIVERED
 *   - store name:    from the first product, if any
 *
 * The "awaiting" and "delivered" counts need the actual order list,
 * so we fetch size=100. At our scale (<100 orders per seller) this
 * is fine. If a seller had thousands of orders we'd want a dedicated
 * aggregates endpoint on the backend.
 */
export function SellerOverviewContent() {
  const productsQuery = useSellerProducts({ page: 0, size: 1 });
  const ordersQuery = useSellerOrders({ page: 0, size: 100 });

  const isLoading = productsQuery.isLoading || ordersQuery.isLoading;
  const error = productsQuery.error || ordersQuery.error;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
      >
        <p className="text-sm font-medium text-destructive">
          {toErrorMessage(error)}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            productsQuery.refetch();
            ordersQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  const totalProducts = productsQuery.data?.totalElements ?? 0;
  const totalOrders = ordersQuery.data?.totalElements ?? 0;

  const orders = ordersQuery.data?.content ?? [];
  const awaitingCount = orders.filter(
    (o) =>
      o.status === 'PAID' ||
      o.status === 'PROCESSING' ||
      o.status === 'SHIPPED',
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.status === 'DELIVERED',
  ).length;

  // Empty-state: seller has no products yet. This is a fresh seller
  // who just accepted an invite. Give them a clear next step.
  if (totalProducts === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand/10">
          <Store className="h-6 w-6 text-brand" />
        </div>
        <h2 className="font-display text-xl font-medium">
          Welcome to your store
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Your store is set up and ready. Add your first product to start
          selling on the marketplace.
        </p>
        <Link to="/seller/products" className="mt-2">
          <Button size="lg">
            <Package className="h-4 w-4" />
            Add your first product
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SellerStatCard
          label="Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4" />}
          to="/seller/products"
          hint="Active listings"
        />
        <SellerStatCard
          label="Orders"
          value={totalOrders}
          icon={<ShoppingBag className="h-4 w-4" />}
          to="/seller/orders"
          hint="All time"
        />
        <SellerStatCard
          label="Awaiting action"
          value={awaitingCount}
          icon={<Truck className="h-4 w-4" />}
          to="/seller/orders"
          tone={awaitingCount > 0 ? 'warning' : 'neutral'}
          hint={awaitingCount > 0 ? 'Needs your attention' : 'All clear'}
        />
        <SellerStatCard
          label="Delivered"
          value={deliveredCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          to="/seller/orders"
          tone="success"
          hint="Completed orders"
        />
      </div>

      {/* Recent orders preview */}
      {orders.length > 0 && (
        <section className="rounded-xl border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-medium">
              Recent orders
            </h2>
            <Link
              to="/seller/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </header>
          <ul className="divide-y divide-border">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link
                  to={`/seller/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPrice(order.totalAmount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
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

// Local price formatter — we could import from products/productVisuals
// but that couples this feature to the products feature for a single
// helper. Duping three lines is cheaper than a cross-feature import.
const priceFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

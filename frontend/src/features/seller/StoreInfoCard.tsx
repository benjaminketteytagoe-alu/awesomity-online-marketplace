import { Link } from 'react-router-dom';
import { Package, Store as StoreIcon, Layers, Boxes, Coins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSellerProducts } from './seller.queries';
import { toErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/**
 * Store information card.
 *
 * The backend exposes no dedicated store endpoint (verified in the
 * seller investigation). Store id and name are denormalized into
 * every ProductResponse, so we derive all store details from the
 * seller's product list.
 *
 * When the seller has no products yet, we can't derive a store name
 * — so we show a welcome card instead.
 *
 * Design rationale for the info-only format:
 *   Building an edit form for an endpoint that doesn't exist would be
 *   worse than being honest. The card says what the platform currently
 *   supports and points to the real lever: adding products.
 */
export function StoreInfoCard() {
  const query = useSellerProducts({ page: 0, size: 100 });

  /* ---------- Loading ---------- */
  if (query.isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-label="Loading store information"
      >
        <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (query.isError) {
    return (
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
    );
  }

  const products = query.data?.content ?? [];

  /* ---------- Empty state ---------- */
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand/10">
          <StoreIcon className="h-6 w-6 text-brand" />
        </div>
        <h2 className="font-display text-xl font-medium">
          Your store is empty
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Store details appear here once you have products. Add your
          first product to set up your shop front.
        </p>
        <Link to="/seller/products" className="mt-2">
          <Button size="lg">
            <Package className="h-4 w-4" />
            Add a product
          </Button>
        </Link>
      </div>
    );
  }

  /* ---------- Compute derived stats ---------- */
  // products[0] is guaranteed non-undefined here because we checked
  // products.length === 0 above. TS's noUncheckedIndexedAccess can't
  // prove that, so we destructure with a guard.
  const [first] = products;
  if (!first) {
    // Unreachable given the guard above, but TS wants proof.
    return null;
  }
  const storeName = first.storeName;
  const storeId = first.storeId;

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const categoriesCount = new Set(products.map((p) => p.categoryId)).size;
  const inventoryValue = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0,
  );

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Store identity */}
      <header className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
            <StoreIcon className="h-5 w-5 text-slate-50" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-medium tracking-tight">
              {storeName}
            </h2>
            <p
              className="mt-0.5 font-mono text-xs text-muted-foreground"
              title={storeId}
            >
              ID: {storeId.slice(0, 8)}…
            </p>
          </div>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
        <StatTile
          icon={<Package className="h-4 w-4" />}
          label="Products"
          value={products.length.toString()}
        />
        <StatTile
          icon={<Boxes className="h-4 w-4" />}
          label="Units in stock"
          value={totalUnits.toString()}
        />
        <StatTile
          icon={<Layers className="h-4 w-4" />}
          label="Categories"
          value={categoriesCount.toString()}
        />
        <StatTile
          icon={<Coins className="h-4 w-4" />}
          label="Inventory value"
          value={formatPrice(inventoryValue)}
        />
      </div>

      {/* Footer note */}
      <footer className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Store settings are currently managed by the platform. To
          change your shop front, update your{' '}
          <Link
            to="/seller/products"
            className="font-medium text-foreground hover:underline"
          >
            products
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 px-6 py-5')}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="font-display text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

/* ---------------- helpers ---------------- */

const priceFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

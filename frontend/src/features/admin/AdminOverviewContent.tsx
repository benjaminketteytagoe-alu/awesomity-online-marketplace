import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  Package,
  UserPlus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdminUsers } from './admin.queries';
import { useAdminOrders } from './admin.queries';
import { useAdminApplications } from './admin.queries';
import { useProducts } from '@/features/products/product.queries';
import { AdminStatCard } from './AdminStatCard';
import { toErrorMessage } from '@/lib/api/client';
import { formatPrice } from '@/features/products/productVisuals';

/**
 * Admin overview — the landing page of god mode.
 *
 * Four stat tiles + a preview of pending seller applications. Each
 * stat query requests size=1 so we only pay for totalElements, not
 * content. The applications query is the only one that needs actual
 * rows (for the preview list).
 */
export function AdminOverviewContent() {
  const usersQuery = useAdminUsers({ size: 1 });
  const ordersQuery = useAdminOrders({ size: 1 });
  const productsQuery = useProducts({ size: 1 });
  const appsQuery = useAdminApplications({ size: 5, status: 'PENDING' });

  const isLoading =
    usersQuery.isLoading ||
    ordersQuery.isLoading ||
    productsQuery.isLoading ||
    appsQuery.isLoading;

  const error =
    usersQuery.error ||
    ordersQuery.error ||
    productsQuery.error ||
    appsQuery.error;

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
            usersQuery.refetch();
            ordersQuery.refetch();
            productsQuery.refetch();
            appsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalUsers = usersQuery.data?.totalElements ?? 0;
  const totalOrders = ordersQuery.data?.totalElements ?? 0;
  const totalProducts = productsQuery.data?.totalElements ?? 0;
  const pendingApps = appsQuery.data?.totalElements ?? 0;
  const recentApplications = appsQuery.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AdminStatCard
          label="Users"
          value={totalUsers}
          icon={<Users className="h-4 w-4" />}
          to="/admin/users"
          hint="All accounts"
        />
        <AdminStatCard
          label="Orders"
          value={totalOrders}
          icon={<ShoppingBag className="h-4 w-4" />}
          to="/admin/orders"
          hint="All time"
        />
        <AdminStatCard
          label="Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4" />}
          to="/admin/products"
          hint="Active listings"
        />
        <AdminStatCard
          label="Applications"
          value={pendingApps}
          icon={<UserPlus className="h-4 w-4" />}
          to="/admin/applications"
          tone={pendingApps > 0 ? 'warning' : 'neutral'}
          hint={pendingApps > 0 ? 'Awaiting review' : 'All caught up'}
        />
      </div>

      {/* Pending applications preview */}
      <section className="rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-medium">
              Pending seller applications
            </h2>
            <p className="text-xs text-muted-foreground">
              {pendingApps === 0
                ? 'No applications waiting for review.'
                : `${pendingApps} waiting for review.`}
            </p>
          </div>
          {pendingApps > 0 && (
            <Link
              to="/admin/applications"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Review all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </header>

        {recentApplications.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>All caught up — nothing to review right now.</span>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentApplications.slice(0, 3).map((app) => (
              <li key={app.id}>
                <Link
                  to="/admin/applications"
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {app.shopName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.name} · {app.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(app.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------- helpers ---------------- */

/**
 * Human-friendly relative time. We don't use a library — three cases
 * (minutes, hours, days) cover 99% of the applications an admin sees.
 * Anything older than a month gets a formatted date.
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Keep the price formatter import from being tree-shaken out — we may
// use it in a future revenue tile.
void formatPrice;

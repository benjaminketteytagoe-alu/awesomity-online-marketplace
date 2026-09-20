import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared shell for all seller pages.
 *
 * Renders a tab bar at the top and an <Outlet /> below. Each tab is a
 * real <NavLink> so:
 *   - The active tab is highlighted based on the URL (no state)
 *   - Ctrl/Cmd-click opens in a new tab
 *   - Keyboard navigation works natively
 *
 * The layout is a sibling of the page content, not a wrapper around
 * the individual pages — each /seller/* route renders its own page
 * component inside this shell via React Router's outlet.
 */
export function SellerLayout() {
  return (
    <div className="container py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Seller dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your store, products, and orders.
        </p>
      </header>

      {/* Tab bar */}
      <nav
        aria-label="Seller sections"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
      >
        <SellerTab to="/seller" end icon={<LayoutDashboard className="h-4 w-4" />}>
          Overview
        </SellerTab>
        <SellerTab
          to="/seller/products"
          icon={<Package className="h-4 w-4" />}
        >
          Products
        </SellerTab>
        <SellerTab
          to="/seller/orders"
          icon={<ShoppingBag className="h-4 w-4" />}
        >
          Orders
        </SellerTab>
        <SellerTab to="/seller/store" icon={<Store className="h-4 w-4" />}>
          Store
        </SellerTab>
      </nav>

      <Outlet />
    </div>
  );
}

function SellerTab({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
          isActive
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

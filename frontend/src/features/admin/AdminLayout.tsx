import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  FolderTree,
  UserPlus,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared shell for all admin pages.
 *
 * Tab order reflects daily usefulness:
 *   1. Overview     — the landing page
 *   2. Applications — actionable, needs constant attention
 *   3. Orders       — frequent monitoring
 *   4. Products     — moderation (feature toggle, delete)
 *   5. Users        — user management
 *   6. Stores       — less common
 *   7. Categories   — rarely touched
 *
 * The tab bar uses overflow-x-auto so seven tabs scroll horizontally
 * on narrow screens rather than wrapping into a second row.
 */
export function AdminLayout() {
  return (
    <div className="container py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand" />
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Admin
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, stores, products, orders, and platform settings.
        </p>
      </header>

      <nav
        aria-label="Admin sections"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
      >
        <AdminTab to="/admin" end icon={<LayoutDashboard className="h-4 w-4" />}>
          Overview
        </AdminTab>
        <AdminTab
          to="/admin/applications"
          icon={<UserPlus className="h-4 w-4" />}
        >
          Applications
        </AdminTab>
        <AdminTab
          to="/admin/orders"
          icon={<ShoppingBag className="h-4 w-4" />}
        >
          Orders
        </AdminTab>
        <AdminTab
          to="/admin/products"
          icon={<Package className="h-4 w-4" />}
        >
          Products
        </AdminTab>
        <AdminTab to="/admin/users" icon={<Users className="h-4 w-4" />}>
          Users
        </AdminTab>
        <AdminTab to="/admin/stores" icon={<Store className="h-4 w-4" />}>
          Stores
        </AdminTab>
        <AdminTab
          to="/admin/categories"
          icon={<FolderTree className="h-4 w-4" />}
        >
          Categories
        </AdminTab>
      </nav>

      <Outlet />
    </div>
  );
}

function AdminTab({
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

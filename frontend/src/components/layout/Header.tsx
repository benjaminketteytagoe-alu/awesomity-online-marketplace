import { Link, NavLink } from 'react-router-dom';
import { LogOut, Package, Shield, Store, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';
import { tokenStorage } from '@/lib/storage';

/**
 * Global header.
 * Step 14.2: shows logo, primary nav, and a basic user menu.
 * Step 14.9 will replace the user menu with a proper Radix dropdown.
 */
export function Header() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = () => {
    tokenStorage.clear();
    clear();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">
              M
            </span>
          </div>
          <span className="font-display text-base font-medium tracking-tight text-foreground">
            Marketplace
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavItem to="/products">Products</NavItem>
          <NavItem to="/categories">Categories</NavItem>
          {user?.role === 'SELLER' && (
            <NavItem to="/seller" icon={<Store className="h-4 w-4" />}>
              Seller
            </NavItem>
          )}
          {user?.role === 'ADMIN' && (
            <NavItem to="/admin" icon={<Shield className="h-4 w-4" />}>
              Admin
            </NavItem>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/orders"
                className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex md:items-center md:gap-2"
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="hidden text-sm font-medium md:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({
  to,
  children,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 text-sm transition-colors',
          isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

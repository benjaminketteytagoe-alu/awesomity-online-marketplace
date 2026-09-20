import { Shield, Store as StoreIcon, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from './admin.types';

interface UserRoleBadgeProps {
  role: 'ADMIN' | 'SHOPPER' | 'SELLER';
  className?: string;
}

/**
 * Role pill. Color-coded by role significance:
 *   ADMIN   — brand-tinted (the god mode)
 *   SELLER  — success-tinted (business partner)
 *   SHOPPER — muted (default user)
 */
export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const styles: Record<UserRole, string> = {
    ADMIN: 'bg-brand/10 text-brand',
    SELLER: 'bg-success/10 text-success',
    SHOPPER: 'bg-muted text-muted-foreground',
  };
  const labels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    SELLER: 'Seller',
    SHOPPER: 'Shopper',
  };
  const icons: Record<UserRole, React.ReactNode> = {
    ADMIN: <Shield className="h-3 w-3" />,
    SELLER: <StoreIcon className="h-3 w-3" />,
    SHOPPER: <ShoppingBag className="h-3 w-3" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        styles[role],
        className,
      )}
    >
      {icons[role]}
      {labels[role]}
    </span>
  );
}

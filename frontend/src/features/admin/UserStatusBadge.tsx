import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStatusBadgeProps {
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  className?: string;
}

/**
 * Status pill for user accounts.
 */
export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const styles = {
    ACTIVE: 'bg-success/10 text-success',
    PENDING_VERIFICATION: 'bg-warning/10 text-warning',
    SUSPENDED: 'bg-destructive/10 text-destructive',
  } as const;
  const labels = {
    ACTIVE: 'Active',
    PENDING_VERIFICATION: 'Pending verification',
    SUSPENDED: 'Suspended',
  } as const;
  const icons = {
    ACTIVE: <CheckCircle2 className="h-3 w-3" />,
    PENDING_VERIFICATION: <Clock className="h-3 w-3" />,
    SUSPENDED: <AlertTriangle className="h-3 w-3" />,
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        styles[status],
        className,
      )}
    >
      {icons[status]}
      {labels[status]}
    </span>
  );
}

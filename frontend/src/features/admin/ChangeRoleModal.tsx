import { useEffect, useState } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useUpdateUserRole } from './admin.queries';
import type { AdminUserSummary } from './admin.types';

type Role = 'ADMIN' | 'SHOPPER' | 'SELLER';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserSummary | null;
}

/**
 * Confirmation modal for changing a user's role.
 *
 * We don't pre-disable options the backend would reject (like
 * demoting a seller with a store) — instead we let the admin see
 * what they'd be choosing and let the backend reject if invalid.
 * We've already disabled the button in the row when the store rule
 * applies, so this situation shouldn't arise in practice.
 */
export function ChangeRoleModal({
  isOpen,
  onClose,
  user,
}: ChangeRoleModalProps) {
  const [newRole, setNewRole] = useState<Role>('SHOPPER');
  const mutation = useUpdateUserRole();

  useEffect(() => {
    if (isOpen && user) {
      // Default to current role
      setNewRole(user.role);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, mutation.isPending, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const unchanged = newRole === user.role;

  const handleSubmit = async () => {
    if (unchanged) {
      onClose();
      return;
    }
    try {
      await mutation.mutateAsync({ id: user.id, payload: { role: newRole } });
      toast.success(`${user.name}'s role changed to ${newRole}`);
      onClose();
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => !mutation.isPending && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-role-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10">
          <UserCog className="h-5 w-5 text-brand" />
        </div>

        <h2
          id="change-role-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Change user role
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          Changing <span className="font-medium text-foreground">{user.name}</span>'s
          role affects what they can access across the platform.
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <span className="text-muted-foreground">Current role</span>
            <span className="font-medium">{user.role}</span>
          </div>

          <div>
            <label
              htmlFor="role-select"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              New role
            </label>
            <select
              id="role-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              disabled={mutation.isPending}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <option value="SHOPPER">SHOPPER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {newRole === 'ADMIN' && (
            <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
              Admin is god mode. This user will have full access to users,
              stores, products, orders, and categories.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={mutation.isPending || unchanged}
            className="flex-1"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save role'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

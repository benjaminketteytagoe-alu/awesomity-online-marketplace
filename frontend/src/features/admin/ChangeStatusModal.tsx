import { useEffect } from 'react';
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useUpdateUserStatus } from './admin.queries';
import type { AdminUserSummary } from './admin.types';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserSummary | null;
}

/**
 * Suspend / activate confirmation modal.
 *
 * Which action is being taken is derived from the user's current
 * status: ACTIVE or PENDING_VERIFICATION → Suspend; SUSPENDED →
 * Activate. This avoids needing an extra prop from the parent.
 */
export function ChangeStatusModal({
  isOpen,
  onClose,
  user,
}: ChangeStatusModalProps) {
  const mutation = useUpdateUserStatus();

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

  const isActivating = user.status === 'SUSPENDED';
  const nextStatus: 'ACTIVE' | 'SUSPENDED' = isActivating ? 'ACTIVE' : 'SUSPENDED';

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        id: user.id,
        payload: { status: nextStatus },
      });
      toast.success(
        isActivating
          ? `${user.name} reactivated`
          : `${user.name} suspended`,
      );
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
        aria-labelledby="change-status-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
            isActivating ? 'bg-success/10' : 'bg-destructive/10'
          }`}
        >
          {isActivating ? (
            <ShieldCheck className="h-5 w-5 text-success" />
          ) : (
            <ShieldOff className="h-5 w-5 text-destructive" />
          )}
        </div>

        <h2
          id="change-status-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          {isActivating ? 'Reactivate account?' : 'Suspend account?'}
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{user.name}</span>{' '}
          {isActivating
            ? 'will regain access to the platform immediately.'
            : 'will be unable to log in or access any part of the platform until reactivated.'}
        </p>

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
            disabled={mutation.isPending}
            className={`flex-1 ${
              isActivating
                ? 'bg-success hover:bg-success/90'
                : 'bg-destructive hover:bg-destructive/90'
            }`}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isActivating ? (
              'Reactivate'
            ) : (
              'Suspend'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

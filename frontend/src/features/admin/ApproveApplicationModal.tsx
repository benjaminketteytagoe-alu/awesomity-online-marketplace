import { useEffect } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useApproveApplication } from './admin.queries';
import type { SellerApplicationSummary } from './admin.types';

interface ApproveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplicationSummary | null;
}

/**
 * Confirmation modal for approving a seller application.
 *
 * Why a modal and not a plain click: approval triggers the backend to
 * send an invite email — an irreversible external side effect. If the
 * admin approves the wrong application by accident, a real person
 * receives an unwanted email and the application is locked into
 * APPROVED state (no undo).
 *
 * The modal repeats the shop name and email so the admin can verify
 * before committing.
 */
export function ApproveApplicationModal({
  isOpen,
  onClose,
  application,
}: ApproveApplicationModalProps) {
  const mutation = useApproveApplication();

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

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(application.id);
      toast.success('Application approved. Invite email sent.');
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
        aria-labelledby="approve-app-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>

        <h2
          id="approve-app-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Approve application?
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {application.shopName}
          </span>{' '}
          will be approved. An invite email will be sent to{' '}
          <span className="font-medium text-foreground">
            {application.email}
          </span>
          .
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/5 p-3 text-xs text-brand-foreground/90">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <p>
            This action cannot be undone. The applicant will receive a
            one-time link to set their password and create their store.
          </p>
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
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="flex-1 bg-success hover:bg-success/90"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving…
              </>
            ) : (
              'Approve & send invite'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

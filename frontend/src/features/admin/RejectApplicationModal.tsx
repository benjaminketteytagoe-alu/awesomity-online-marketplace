import { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { toErrorMessage } from '@/lib/api/client';
import { useRejectApplication } from './admin.queries';
import type { SellerApplicationSummary } from './admin.types';

const MAX_REASON = 500;

interface RejectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerApplicationSummary | null;
}

/**
 * Rejection modal with reason input.
 *
 * The backend requires a reason (@NotBlank, @Size(max=500)) which
 * appears in the rejection email. We cap the textarea at 500 chars
 * and show a live counter so users don't hit the limit unexpectedly.
 */
export function RejectApplicationModal({
  isOpen,
  onClose,
  application,
}: RejectApplicationModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useRejectApplication();

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen, application]);

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

  const trimmed = reason.trim();
  const remaining = MAX_REASON - reason.length;

  const handleSubmit = async () => {
    if (trimmed.length === 0) {
      setError('Reason is required.');
      return;
    }
    if (reason.length > MAX_REASON) {
      setError(`Reason must be at most ${MAX_REASON} characters.`);
      return;
    }
    try {
      await mutation.mutateAsync({
        id: application.id,
        payload: { reason: trimmed },
      });
      toast.success('Application rejected.');
      onClose();
    } catch (err) {
      setError(toErrorMessage(err));
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
        aria-labelledby="reject-app-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
          <XCircle className="h-5 w-5 text-destructive" />
        </div>

        <h2
          id="reject-app-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Reject application?
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {application.shopName}
          </span>{' '}
          will be rejected. The reason below will be included in the
          rejection email.
        </p>

        <div className="mt-4">
          <Field label="Rejection reason" error={error ?? undefined} required>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_REASON}
              placeholder="Explain why the application is being rejected…"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[invalid=true]:border-destructive"
            />
          </Field>
          <p
            className={`mt-1 text-right text-xs ${
              remaining < 50 ? 'text-warning' : 'text-muted-foreground'
            }`}
          >
            {remaining} characters remaining
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
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              'Reject'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

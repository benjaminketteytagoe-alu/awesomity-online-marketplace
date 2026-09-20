import { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useDeleteStore } from './admin.queries';
import type { AdminStoreSummary } from './admin.types';

interface DeleteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: AdminStoreSummary | null;
}

/**
 * Delete store confirmation.
 *
 * Store deletion cascades to all products on the backend
 * (AdminStoreService.softDelete calls productRepository.softDeleteAllByStoreId).
 * The modal repeats the product count so the admin understands the scope.
 */
export function DeleteStoreModal({
  isOpen,
  onClose,
  store,
}: DeleteStoreModalProps) {
  const mutation = useDeleteStore();

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

  if (!isOpen || !store) return null;

  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(store.id);
      toast.success(`Store "${store.name}" removed`);
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
        aria-labelledby="delete-store-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>

        <h2
          id="delete-store-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Delete store?
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{store.name}</span>{' '}
          will be removed. This will also remove{' '}
          <span className="font-medium text-foreground">
            {store.productCount}{' '}
            {store.productCount === 1 ? 'product' : 'products'}
          </span>{' '}
          from the marketplace.
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Historical orders are unaffected. The seller account itself
          is not deleted.
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
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete store
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

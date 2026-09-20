import { useEffect } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useAdminDeleteProduct } from './admin.queries';
import type { Product } from './admin.types';

interface DeleteProductConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

/**
 * Confirmation dialog for admin product deletion.
 *
 * Different from the seller delete modal in wording: the admin is
 * not the owner, so the message reflects a moderation action
 * ("remove from the marketplace" vs "delete your product").
 */
export function DeleteProductConfirmModal({
  isOpen,
  onClose,
  product,
}: DeleteProductConfirmModalProps) {
  const mutation = useAdminDeleteProduct();

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

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(product.id);
      toast.success('Product removed');
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
        aria-labelledby="admin-delete-product-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>

        <h2
          id="admin-delete-product-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Remove this product?
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {product.name}
          </span>{' '}
          by {product.storeName} will be removed from the marketplace.
          Historical orders are unaffected.
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
                Removing…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/client';
import { useDeleteCategory } from './admin.queries';
import type { Category } from './admin.types';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

/**
 * Delete category confirmation.
 *
 * The backend rejects deletion if any product references the category
 * (see AdminCategoryController's delete doc: "only if unused"). We
 * surface that constraint in the modal text and let the backend
 * error propagate if the admin tries anyway.
 */
export function DeleteCategoryModal({
  isOpen,
  onClose,
  category,
}: DeleteCategoryModalProps) {
  const mutation = useDeleteCategory();

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

  if (!isOpen || !category) return null;

  const handleDelete = async () => {
    try {
      await mutation.mutateAsync(category.id);
      toast.success('Category deleted');
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
        aria-labelledby="delete-category-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>

        <h2
          id="delete-category-title"
          className="mt-4 text-center font-display text-lg font-medium tracking-tight"
        >
          Delete category?
        </h2>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{category.name}</span>{' '}
          will be removed.
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Categories can only be deleted if no products reference them.
          If any do, the delete will fail.
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
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

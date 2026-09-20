import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/lib/api/client';
import { useCreateCategory, useUpdateCategory } from './admin.queries';
import type { Category } from './admin.types';

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
}

/**
 * Create/edit modal for categories.
 *
 * The backend generates the slug from the name — we only send name
 * and description.
 */
export function CategoryFormModal({
  isOpen,
  onClose,
  category,
}: CategoryFormModalProps) {
  const isEdit = Boolean(category);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: 'onTouched',
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
    });
  }, [isOpen, category, form]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      description:
        values.description && values.description.trim().length > 0
          ? values.description.trim()
          : null,
    };
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, payload });
        toast.success('Category updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Category created');
      }
      onClose();
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => !isBusy && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-brand" />
            <h2
              id="category-form-title"
              className="font-display text-lg font-medium tracking-tight"
            >
              {isEdit ? 'Edit category' : 'New category'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          <Field label="Name" error={form.formState.errors.name?.message} required>
            <Input
              autoFocus
              placeholder="e.g. Kitchen & Dining"
              {...form.register('name')}
            />
          </Field>

          <Field
            label="Description"
            error={form.formState.errors.description?.message}
            hint="Optional. Max 500 characters."
          >
            <textarea
              rows={3}
              placeholder="Short description of this category…"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[invalid=true]:border-destructive"
              {...form.register('description')}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isBusy}
              className="flex-1"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create category'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

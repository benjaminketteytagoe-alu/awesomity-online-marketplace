import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/lib/api/client';
import { useCategories } from '@/features/categories/category.queries';
import { useCreateProduct, useUpdateProduct } from './seller.queries';
import {
  productFormSchema,
  type ProductFormValues,
} from './product.schemas';
import type { Product } from './seller.types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When present, the form is in edit mode pre-filled with this product. */
  product?: Product;
  onSuccess?: () => void;
}

/**
 * Create/edit product modal.
 *
 * One component, two modes — determined by whether `product` is
 * present. Shared fields, shared validation, different submit target.
 *
 * Notable behavior:
 *   - The form always sends every field, even in edit mode. This is
 *     intuitive: whatever you see in the form is what gets saved.
 *     The trade-off is that "clear a field to null" doesn't work — the
 *     backend treats null as "leave unchanged". Acceptable for now.
 */
export function ProductFormModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const categoriesQuery = useCategories();

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
    },
  });

  // Reset/populate the form whenever the modal opens. Without this,
  // opening edit on product A, closing, then opening edit on product B
  // would show product A's values.
  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product ? product.price.toString() : '',
      stock: product ? product.stock.toString() : '',
      categoryId: product?.categoryId ?? '',
    });
  }, [isOpen, product, form]);

  // Escape closes the modal (but not while submitting).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isBusy, onClose]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      description:
        values.description && values.description.trim().length > 0
          ? values.description.trim()
          : null,
      price: parseFloat(values.price),
      stock: parseInt(values.stock, 10),
      categoryId: values.categoryId,
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, payload });
        toast.success('Product updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Product created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  });

  if (!isOpen) return null;

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={() => !isBusy && onClose()}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id="product-form-title"
            className="font-display text-lg font-medium tracking-tight"
          >
            {isEdit ? 'Edit product' : 'New product'}
          </h2>
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

        {/* Body */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field
              label="Name"
              error={form.formState.errors.name?.message}
              required
            >
              <Input
                autoFocus
                placeholder="Hand-thrown ceramic mug"
                {...form.register('name')}
              />
            </Field>

            <Field
              label="Description"
              error={form.formState.errors.description?.message}
              hint="Optional. Max 5000 characters."
            >
              <textarea
                rows={3}
                placeholder="A short description of your product…"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[invalid=true]:border-destructive"
                {...form.register('description')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Price (£)"
                error={form.formState.errors.price?.message}
                required
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="19.99"
                  {...form.register('price')}
                />
              </Field>

              <Field
                label="Stock"
                error={form.formState.errors.stock?.message}
                required
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="10"
                  {...form.register('stock')}
                />
              </Field>
            </div>

            <Field
              label="Category"
              error={form.formState.errors.categoryId?.message}
              required
            >
              <select
                {...form.register('categoryId')}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[invalid=true]:border-destructive"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            {categoriesQuery.isLoading && (
              <p className="text-xs text-muted-foreground">
                Loading categories…
              </p>
            )}
          </div>

          {/* Footer */}
          <footer className="flex gap-2 border-t border-border px-5 py-4">
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
              className="flex-[2]"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create product'
              )}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

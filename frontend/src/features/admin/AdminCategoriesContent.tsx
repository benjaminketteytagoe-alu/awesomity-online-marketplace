import { useState } from 'react';
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCategories } from '@/features/categories/category.queries';
import { CategoryFormModal } from './CategoryFormModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import { toErrorMessage } from '@/lib/api/client';
import type { Category } from './admin.types';

/**
 * Category CRUD.
 *
 * Uses the public /api/categories endpoint for reading; mutations go
 * through /api/admin/categories. Both invalidate categoryKeys so the
 * public filter dropdown updates immediately.
 */
export function AdminCategoriesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const query = useCategories();

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {query.data?.length ?? 0}{' '}
          {query.data?.length === 1 ? 'category' : 'categories'}
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading categories">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {query.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {toErrorMessage(query.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {query.isSuccess && query.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">
            No categories yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first category to organize products.
          </p>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && query.data.length > 0 && (
        <ul className="space-y-3">
          {query.data.map((category) => (
            <li key={category.id}>
              <article className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10">
                  <FolderTree className="h-4 w-4 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-medium">
                    {category.name}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    /{category.slug}
                  </p>
                  {category.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(category)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        category={editing ?? undefined}
      />
      <DeleteCategoryModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        category={deleting}
      />
    </div>
  );
}

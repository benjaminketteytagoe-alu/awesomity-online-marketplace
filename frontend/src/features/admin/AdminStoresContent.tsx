import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdminStores } from './admin.queries';
import { AdminStoreRow } from './AdminStoreRow';
import { DeleteStoreModal } from './DeleteStoreModal';
import { toErrorMessage } from '@/lib/api/client';
import type { AdminStoreSummary } from './admin.types';

const PAGE_SIZE = 20;

/**
 * Admin stores list.
 *
 * Paginated. Only two operations: view (row) and delete (cascades to
 * products). The backend has no admin store update endpoint — store
 * editing isn't part of the admin's scope.
 */
export function AdminStoresContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleting, setDeleting] = useState<AdminStoreSummary | null>(null);

  const urlPage = parsePositiveInt(searchParams.get('page'), 1);
  const apiPage = Math.max(0, urlPage - 1);

  const query = useAdminStores({ page: apiPage, size: PAGE_SIZE });

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next === 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading stores">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      )}

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

      {query.isSuccess && query.data.content.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Store className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">No stores yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Stores are created when seller applications are approved.
          </p>
        </div>
      )}

      {query.isSuccess && query.data.content.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {query.data.totalElements.toLocaleString()}{' '}
            {query.data.totalElements === 1 ? 'store' : 'stores'}
          </p>

          <ul className="space-y-3">
            {query.data.content.map((store) => (
              <li key={store.id}>
                <AdminStoreRow
                  store={store}
                  onDelete={() => setDeleting(store)}
                />
              </li>
            ))}
          </ul>

          {query.data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={query.data.first}
                onClick={() => handlePageChange(urlPage - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {urlPage} of {query.data.totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={query.data.last}
                onClick={() => handlePageChange(urlPage + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      <DeleteStoreModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        store={deleting}
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

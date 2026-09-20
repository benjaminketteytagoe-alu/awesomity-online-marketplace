import { Store as StoreIcon, Package, User, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AdminStoreSummary } from './admin.types';

interface AdminStoreRowProps {
  store: AdminStoreSummary;
  onDelete: () => void;
}

/**
 * One store row.
 *
 * Shows the store identity, owner info, and product count. No edit
 * action — the backend has no admin store update endpoint. Delete is
 * the only mutation available.
 */
export function AdminStoreRow({ store, onDelete }: AdminStoreRowProps) {
  return (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
      {/* Store icon */}
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
        <StoreIcon className="h-5 w-5 text-slate-50" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-medium">
          {store.name}
        </h3>
        {store.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {store.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {store.ownerName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {store.ownerEmail}
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3" />
            {store.productCount}{' '}
            {store.productCount === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${store.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    </article>
  );
}

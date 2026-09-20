import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useProducts } from '@/features/products/product.queries';
import { AdminProductRow } from './AdminProductRow';
import { DeleteProductConfirmModal } from './DeleteProductConfirmModal';
import { toErrorMessage } from '@/lib/api/client';
import type { Product } from './admin.types';

/**
 * Admin products moderation.
 *
 * Uses the public /api/products endpoint rather than a dedicated
 * admin list. The backend's AdminProductController only exposes
 * feature/unfeature/delete — no list. Documented limitation: admin
 * doesn't see soft-deleted products here.
 *
 * Filters are client-side (search + featured-only toggle) because
 * the public endpoint doesn't accept them. If the catalog grows past
 * a few hundred products, we'd add a backend admin list endpoint.
 */
export function AdminProductsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const featuredOnly = searchParams.get('filter') === 'featured';

  // Fetch a large page — the endpoint defaults to 20/page, we ask
  // for more. This covers the current catalog; see file header for
  // the scale limitation.
  const query = useProducts({ page: 0, size: 100 });

  // Wrap in useMemo so the array reference is stable across renders
  // when the underlying data hasn't changed. Without this, the
  // nullish fallback `?? []` would produce a fresh array on every
  // render and break the memoization of `filtered` below.
  const products = useMemo(
    () => query.data?.content ?? [],
    [query.data],
  );

  // Client-side filtering: featured + search. Both recompute only
  // when their inputs change.
  const filtered = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return products.filter((p) => {
      if (featuredOnly && !p.featured) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, featuredOnly, searchInput]);

  const toggleFeaturedOnly = () => {
    const next = new URLSearchParams(searchParams);
    if (featuredOnly) next.delete('filter');
    else next.set('filter', 'featured');
    setSearchParams(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <button
          type="button"
          onClick={toggleFeaturedOnly}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            featuredOnly
              ? 'bg-brand/15 text-brand'
              : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {featuredOnly ? '✓ ' : ''}Featured only
        </button>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Loading products">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/50"
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
      {query.isSuccess && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-medium">
            {products.length === 0
              ? 'No products on the platform'
              : 'No products match your filters'}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {products.length === 0
              ? 'Products listed by sellers will appear here.'
              : 'Try a different search term or clear the featured filter.'}
          </p>
        </div>
      )}

      {/* Success */}
      {query.isSuccess && filtered.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'product' : 'products'}
            {featuredOnly && ' (featured)'}
          </p>

          <ul className="space-y-3">
            {filtered.map((product) => (
              <li key={product.id}>
                <AdminProductRow
                  product={product}
                  onDelete={() => setDeleting(product)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <DeleteProductConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        product={deleting}
      />
    </div>
  );
}

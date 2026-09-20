import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  formatPrice,
  gradientFor,
  initialsFor,
  stockState,
} from '@/features/products/productVisuals';
import { useSellerProducts } from './seller.queries';
import { ProductFormModal } from './ProductFormModal';
import { DeleteProductModal } from './DeleteProductModal';
import { toErrorMessage } from '@/lib/api/client';
import type { Product } from './seller.types';

/**
 * Seller products page content.
 *
 * Card list of the seller's own products with create/edit/delete
 * actions. Modal state lives here because the modals need to know
 * which product (if any) is being acted on.
 *
 * Pagination is not implemented — we fetch size=100 and show all. A
 * seller with more than 100 products would need pagination; noted as
 * a scale limit, not a bug.
 */
export function SellerProductsContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const query = useSellerProducts({ page: 0, size: 100 });

  /* ---------------- Loading ---------------- */
  if (query.isLoading) {
    return (
      <div
        className="space-y-3"
        role="status"
        aria-label="Loading products"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  /* ---------------- Error ---------------- */
  if (query.isError) {
    return (
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
    );
  }

  const products = query.data?.content ?? [];

  const openCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  /* ---------------- Empty state ---------------- */
  if (products.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand/10">
            <Package className="h-6 w-6 text-brand" />
          </div>
          <h2 className="font-display text-xl font-medium">No products yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Add your first product to start selling on the marketplace.
          </p>
          <Button size="lg" onClick={openCreate} className="mt-2">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>

        <ProductFormModal
          isOpen={isFormOpen}
          onClose={closeForm}
          product={editingProduct ?? undefined}
        />
      </>
    );
  }

  /* ---------------- With products ---------------- */
  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {/* Card list */}
      <ul className="space-y-3">
        {products.map((product) => (
          <li key={product.id}>
            <ProductRow
              product={product}
              onEdit={() => openEdit(product)}
              onDelete={() => setDeletingProduct(product)}
            />
          </li>
        ))}
      </ul>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        product={editingProduct ?? undefined}
      />
      <DeleteProductModal
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
      />
    </>
  );
}

/* ---------------- Row ---------------- */

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const gradient = gradientFor(product.name);
  const initials = initialsFor(product.name);
  const stock = stockState(product.stock);

  return (
    <div className="flex items-stretch gap-4 rounded-xl border border-border bg-surface p-4">
      {/* Thumbnail — links to the public product page so the seller
          can preview what shoppers see. */}
      <Link
        to={`/products/${product.id}`}
        className={cn(
          'grid h-20 w-20 shrink-0 place-items-center rounded-lg',
          'bg-gradient-to-br',
          gradient,
        )}
        aria-label={`Preview ${product.name}`}
      >
        <span className="font-display text-xl font-medium text-foreground/70">
          {initials}
        </span>
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 font-display text-base font-medium">
              {product.name}
            </h3>
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                <Sparkles className="h-2.5 w-2.5" />
                Featured
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {product.categoryName}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-lg font-semibold tabular-nums">
            {formatPrice(product.price)}
          </span>
          <span
            className={cn(
              'text-xs',
              stock === 'out-of-stock' && 'text-destructive font-medium',
              stock === 'low-stock' && 'text-warning font-medium',
              stock === 'in-stock' && 'text-muted-foreground',
            )}
          >
            {stock === 'out-of-stock'
              ? 'Out of stock'
              : stock === 'low-stock'
                ? `Only ${product.stock} left`
                : `${product.stock} in stock`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${product.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${product.name}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProduct } from '@/features/products/product.queries';
import { AddToCartButton } from '@/features/cart/AddToCartButton';
import { ProductReviewsSection } from '@/features/reviews/ProductReviewsSection';
import { ProductDetailSkeleton } from '@/features/products/ProductDetailSkeleton';
import {
  formatPrice,
  gradientFor,
  initialsFor,
  stockState,
} from '@/features/products/productVisuals';
import { toErrorMessage } from '@/lib/api/client';

/**
 * Product detail page.
 *
 * Reads :id from the URL. The useProduct hook has `enabled: !!id`
 * internally, so a bad URL doesn't fire a request. Everything else is
 * pure composition of the loading / error / not-found / success states.
 *
 * The add-to-cart CTA is intentionally absent — it arrives in Step 14.6
 * along with the cart. The layout doesn't have an empty slot waiting for
 * it; when 14.6 lands, we insert the button and it slots naturally.
 */
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useProduct(id);

  // ---------- Loading ----------
  if (query.isLoading) {
    return (
      <div className="container py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  // ---------- Error / Not found ----------
  if (query.isError) {
    // The backend returns 404 for products that don't exist OR that are
    // soft-deleted. From the user's perspective both are "not found".
    // We render the same friendly state for either.
    return <NotFoundCard error={toErrorMessage(query.error)} />;
  }

  // ---------- Success ----------
  // query.data is guaranteed non-null here. The `enabled: !!id` guard
  // means we never call this with an empty id; TS still types data as
  // `Product | undefined`, so we narrow with a guard for safety.
  const product = query.data;
  if (!product) return null;

  const stock = stockState(product.stock);
  const gradient = gradientFor(product.name);
  const initials = initialsFor(product.name);

  return (
    <div className="container py-8">
      {/* Back link — visible, keyboard-friendly, always available */}
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ---------- Left column: hero image ---------- */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border">
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradient}`}
          >
            <span className="select-none font-display text-7xl font-medium text-foreground/70">
              {initials}
            </span>
          </div>

          {product.featured && (
            <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-brand px-3 py-1 text-sm font-medium text-brand-foreground">
              Featured
            </span>
          )}
        </div>

        {/* ---------- Right column: details ---------- */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            <Link to="/products" className="hover:text-foreground">
              Products
            </Link>
            <span aria-hidden>·</span>
            <span>{product.categoryName}</span>
          </nav>

          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-foreground md:text-4xl">
            {product.name}
          </h1>

          <p className="text-sm text-muted-foreground">
            Sold by{' '}
            <span className="font-medium text-foreground">
              {product.storeName}
            </span>
          </p>

          {/* Price */}
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">
            {formatPrice(product.price)}
          </p>

          {/* Stock badge */}
          <StockBadge stock={stock} count={product.stock} />

          {/* Add to cart — quantity picker + button */}
          <AddToCartButton product={product} className="mt-2" />

          {/* Description */}
          {product.description ? (
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {product.description}
            </div>
          ) : (
            <p className="mt-4 text-sm italic text-muted-foreground">
              No description provided for this product.
            </p>
          )}

          {/* Meta footer */}
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Category
              </dt>
              <dd className="mt-1 text-foreground">{product.categoryName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                SKU
              </dt>
              {/* Use the first 8 chars of the UUID as a display SKU.
                  Stable, deterministic, good enough for a listing. */}
              <dd className="mt-1 font-mono text-xs text-muted-foreground">
                {product.id.slice(0, 8).toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Reviews section — full width below the two-column layout */}
      <ProductReviewsSection productId={product.id} />
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

/**
 * Stock badge variant shown on the detail page. Larger and more
 * prominent than the card version — the user is deciding whether to
 * buy, so stock status deserves visual weight.
 */
function StockBadge({
  stock,
  count,
}: {
  stock: ReturnType<typeof stockState>;
  count: number;
}) {
  if (stock === 'out-of-stock') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
        <XCircle className="h-4 w-4" />
        Out of stock
      </span>
    );
  }
  if (stock === 'low-stock') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
        <AlertTriangle className="h-4 w-4" />
        Only {count} left in stock
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
      <CheckCircle2 className="h-4 w-4" />
      In stock
    </span>
  );
}

/**
 * Friendly not-found card. Same visual language as the empty grid state
 * so the user never feels like they hit a wall — they just landed
 * somewhere without content.
 */
function NotFoundCard({ error }: { error: string }) {
  return (
    <div className="container py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="font-display text-lg font-medium text-foreground">
          Product not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Link to="/products" className="mt-3">
          <Button variant="secondary" size="md">
            Browse all products
          </Button>
        </Link>
      </div>
    </div>
  );
}

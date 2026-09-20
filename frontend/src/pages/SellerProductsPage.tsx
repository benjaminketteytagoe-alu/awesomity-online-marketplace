import { Package } from 'lucide-react';

/**
 * Placeholder — the real products CRUD lands in Step 14.7 Block D.
 * A thin stub so the tab navigation works and the shell can be
 * verified end to end before the pages are built.
 */
export function SellerProductsPage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-display text-lg font-medium">Products</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Product management lands in the next block. This placeholder
        exists so the seller shell and routing can be verified.
      </p>
    </div>
  );
}

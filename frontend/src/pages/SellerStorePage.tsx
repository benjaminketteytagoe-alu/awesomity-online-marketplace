import { Store } from 'lucide-react';

/**
 * Placeholder — the real store info card lands in Step 14.7 Block C.
 * The backend has no store-edit endpoint (see Block A investigation
 * notes), so this will be a read-only view derived from the
 * seller's products.
 */
export function SellerStorePage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Store className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-display text-lg font-medium">Store</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Store information lands in the next block. This placeholder
        exists so the seller shell and routing can be verified.
      </p>
    </div>
  );
}

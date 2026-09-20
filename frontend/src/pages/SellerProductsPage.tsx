import { SellerProductsContent } from '@/features/seller/SellerProductsContent';

/**
 * /seller/products — the seller's product management page.
 *
 * Renders only the content. The SellerLayout (tabs, heading) is
 * provided by the router as the parent route element.
 */
export function SellerProductsPage() {
  return <SellerProductsContent />;
}

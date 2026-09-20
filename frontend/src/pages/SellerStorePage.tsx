import { StoreInfoCard } from '@/features/seller/StoreInfoCard';

/**
 * /seller/store — read-only store information.
 *
 * Renders only the info card. The SellerLayout (tabs, heading) is
 * provided by the router as the parent route element.
 */
export function SellerStorePage() {
  return <StoreInfoCard />;
}

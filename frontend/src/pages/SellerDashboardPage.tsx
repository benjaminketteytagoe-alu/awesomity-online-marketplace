import { SellerOverviewContent } from '@/features/seller/SellerOverviewContent';

/**
 * /seller — the seller's landing page.
 *
 * Renders only the overview content. The SellerLayout (tab bar,
 * header) is provided by the router as the parent route element.
 */
export function SellerDashboardPage() {
  return <SellerOverviewContent />;
}

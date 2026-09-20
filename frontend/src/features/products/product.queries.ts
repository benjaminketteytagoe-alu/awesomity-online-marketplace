import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { productApi } from './product.api';
import type {
  FeaturedProductsPage,
  Product,
  ProductListParams,
  ProductPage,
} from './product.types';

/**
 * Query keys for products. Centralized so invalidations are reliable.
 *
 * Structure rationale:
 *   ['products', 'list', {filters}]  — paginated list, keyed by filters
 *   ['products', 'featured', size]   — featured rail, keyed by size
 *   ['products', 'detail', id]       — single product
 *
 * Why nested arrays like ['products', 'list', ...]:
 *   queryClient.invalidateQueries({ queryKey: ['products'] })
 *   invalidates ALL product queries — list, featured, detail.
 *   queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
 *   invalidates only the lists. We need both granularities.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) =>
    [...productKeys.lists(), params] as const,
  featured: (size: number) =>
    [...productKeys.all, 'featured', size] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Fetch a page of products with filters.
 *
 * Why we do NOT use placeholderData: 'previousData' here:
 *   When the user changes filters, showing stale products from the
 *   previous filter under a new URL looks broken — the header says
 *   "Electronics" but the grid shows books. Instead we let the query
 *   go to `isLoading` and show a skeleton. Better UX, no confusion.
 */
export function useProducts(
  params: ProductListParams,
): UseQueryResult<ProductPage> {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.list(params),
    // Products change at human speed, not millisecond speed.
    // 60s stale time means navigating back to the list doesn't refetch
    // if we were just there.
    staleTime: 60_000,
  });
}

/**
 * Fetch the featured products rail.
 *
 * Featured is more stable than the general list — the admin marks a
 * product featured, and it stays that way for days. We cache it longer.
 */
export function useFeaturedProducts(
  size = 12,
): UseQueryResult<FeaturedProductsPage> {
  return useQuery({
    queryKey: productKeys.featured(size),
    queryFn: () => productApi.featured(size),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Fetch a single product by id.
 *
 * enabled: !!id guards against firing with an empty string (which can
 * happen briefly during route transitions). Without it, we'd hit
 * /api/products/ -> 404 during a page change.
 */
export function useProduct(id: string | undefined): UseQueryResult<Product> {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => productApi.byId(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

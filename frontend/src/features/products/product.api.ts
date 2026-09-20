import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  FeaturedProductsPage,
  Product,
  ProductListParams,
  ProductPage,
} from './product.types';

/**
 * Product API client.
 *
 * Design note: this layer knows nothing about TanStack Query. It returns
 * plain Promises. The query hooks (product.queries.ts) wrap these calls.
 * This separation means:
 *   - We can test the API client without a QueryClient.
 *   - We can swap TanStack Query out later without rewriting fetch logic.
 *   - The API client is trivially reusable from non-React code if needed.
 */
export const productApi = {
  /**
   * GET /api/products with filters, paging, sorting.
   * Query params are dropped if undefined, so an empty params object
   * sends a clean request without `page=undefined` garbage.
   */
  async list(params: ProductListParams = {}): Promise<ProductPage> {
    // Build a clean params object — axios drops undefined values
    // automatically, but being explicit here documents intent.
    const query: Record<string, string | number | boolean> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.size !== undefined) query.size = params.size;
    if (params.category) query.category = params.category;
    if (params.search) query.search = params.search;
    if (params.sort) query.sort = params.sort;
    if (params.featured !== undefined) query.featured = params.featured;

    const { data } = await api.get<ProductPage>(ENDPOINTS.products.list, {
      params: query,
    });
    return data;
  },

  /**
   * GET /api/products/featured
   * Returns a Page<Product> (verified), not a bare array.
   * We pass a large size since featured is typically shown as a rail,
   * not paginated.
   */
  async featured(size = 20): Promise<FeaturedProductsPage> {
    const { data } = await api.get<FeaturedProductsPage>(
      ENDPOINTS.products.featured,
      { params: { size } },
    );
    return data;
  },

  /**
   * GET /api/products/{id}
   * Returns a bare Product (no paging wrapper). 404s if not found
   * or if soft-deleted.
   */
  async byId(id: string): Promise<Product> {
    const { data } = await api.get<Product>(ENDPOINTS.products.byId(id));
    return data;
  },
};

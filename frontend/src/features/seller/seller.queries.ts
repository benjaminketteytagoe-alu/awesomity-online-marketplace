import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { Page } from '@/lib/api/types';
import { sellerApi } from './seller.api';
import type {
  CreateProductRequest,
  Order,
  OrderSummary,
  Product,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
} from './seller.types';
import { productKeys } from '@/features/products/product.queries';
import { orderKeys } from '@/features/orders/order.queries';

/**
 * Query keys for seller-scoped resources. Nested under 'seller' so
 * invalidateQueries({ queryKey: ['seller'] }) wipes everything the
 * seller sees in one call (useful for logout or role change).
 */
export const sellerKeys = {
  all: ['seller'] as const,

  products: {
    all: [...['seller'], 'products'] as const,
    list: (params: { page?: number; size?: number }) =>
      [...['seller', 'products', 'list'], params] as const,
  },

  orders: {
    all: [...['seller'], 'orders'] as const,
    list: (params: { page?: number; size?: number }) =>
      [...['seller', 'orders', 'list'], params] as const,
    detail: (id: string) => [...['seller', 'orders', 'detail'], id] as const,
  },
};

/* ===================== Product queries ===================== */

export function useSellerProducts(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Page<Product>> {
  return useQuery({
    queryKey: sellerKeys.products.list(params),
    queryFn: () => sellerApi.listProducts(params),
    staleTime: 30_000,
  });
}

/* ===================== Product mutations ===================== */

/**
 * Create a product.
 *
 * Invalidation strategy:
 *   - sellerKeys.products.all  — new product appears in the seller's own list
 *   - productKeys.all          — the buyer-facing catalog also has this product now
 *
 * That second one is important: without it, a shopper who has /products
 * open in another tab wouldn't see the new listing until they refresh.
 * With it, TanStack Query refetches and the product appears.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductRequest>({
    mutationFn: (payload) => sellerApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.products.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Update a product.
 *
 *   - sellerKeys.products.all  — the seller's list row updates
 *   - productKeys.detail(id)   — buyer detail page (if cached) updates
 *   - productKeys.lists()      — buyer catalog cards update
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { id: string; payload: UpdateProductRequest }
  >({
    mutationFn: ({ id, payload }) => sellerApi.updateProduct(id, payload),
    onSuccess: (_product, { id }) => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.products.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Soft-delete a product.
 *
 *   - sellerKeys.products.all  — the row disappears from the seller list
 *   - productKeys.all          — the buyer catalog no longer shows it
 *
 * We don't invalidate productKeys.detail(id) — the product is soft-
 * deleted so a direct GET would 404 anyway. Removing it from lists
 * is the right behavior.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => sellerApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.products.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/* ===================== Order queries ===================== */

export function useSellerOrders(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Page<OrderSummary>> {
  return useQuery({
    queryKey: sellerKeys.orders.list(params),
    queryFn: () => sellerApi.listOrders(params),
    staleTime: 30_000,
  });
}

export function useSellerOrder(id: string | undefined): UseQueryResult<Order> {
  return useQuery({
    queryKey: sellerKeys.orders.detail(id ?? ''),
    queryFn: () => sellerApi.getOrder(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/* ===================== Order mutations ===================== */

/**
 * Advance an order's status.
 *
 * Invalidation strategy — this is the interesting one because the
 * action crosses feature boundaries:
 *
 *   - sellerKeys.orders.detail(id)  — the seller's own view refreshes
 *   - sellerKeys.orders.all         — the seller's order list updates
 *   - orderKeys.detail(id)          — if the shopper is viewing the
 *     same order in another tab, their timeline advances too
 *   - orderKeys.lists()             — the shopper's order history
 *
 * The cross-feature invalidation is exactly why centralizing query
 * keys in factories matters. Without it, we'd be hunting for the
 * right key string in seller code and hoping it matches the buyer
 * code's key.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    Error,
    { id: string; payload: UpdateOrderStatusRequest }
  >({
    mutationFn: ({ id, payload }) => sellerApi.updateOrderStatus(id, payload),
    onSuccess: (_order, { id }) => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellerKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

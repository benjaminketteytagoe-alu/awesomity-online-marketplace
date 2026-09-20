import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { Page } from '@/lib/api/types';
import { adminApi } from './admin.api';
import { productKeys } from '@/features/products/product.queries';
import { categoryKeys } from '@/features/categories/category.queries';
import { orderKeys } from '@/features/orders/order.queries';
import { sellerKeys } from '@/features/seller/seller.queries';
import type {
  AdminStoreSummary,
  AdminUpdateOrderStatusRequest,
  AdminUserDetail,
  AdminUserSummary,
  Category,
  CategoryRequest,
  Order,
  Product,
  OrderStatus,
  OrderSummary,
  RejectApplicationRequest,
  SellerApplicationSummary,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from './admin.types';

/**
 * Admin query keys.
 *
 * All nested under ['admin', resource, ...] so we can invalidate the
 * whole surface with one call:
 *   queryClient.invalidateQueries({ queryKey: ['admin'] })
 *
 * Useful when an admin's session ends, or as a "refresh everything"
 * escape hatch. Individual mutations invalidate narrower keys.
 */
export const adminKeys = {
  all: ['admin'] as const,

  users: {
    all: ['admin', 'users'] as const,
    list: (params: { role?: string; status?: string; page?: number; size?: number }) =>
      ['admin', 'users', 'list', params] as const,
    detail: (id: string) => ['admin', 'users', 'detail', id] as const,
  },

  stores: {
    all: ['admin', 'stores'] as const,
    list: (params: { page?: number; size?: number }) =>
      ['admin', 'stores', 'list', params] as const,
    detail: (id: string) => ['admin', 'stores', 'detail', id] as const,
  },

  orders: {
    all: ['admin', 'orders'] as const,
    list: (params: { status?: OrderStatus; page?: number; size?: number }) =>
      ['admin', 'orders', 'list', params] as const,
    detail: (id: string) => ['admin', 'orders', 'detail', id] as const,
  },

  categories: {
    all: ['admin', 'categories'] as const,
  },

  applications: {
    all: ['admin', 'applications'] as const,
    list: (params: { status?: string; page?: number; size?: number }) =>
      ['admin', 'applications', 'list', params] as const,
  },
};

/* ===================== User queries ===================== */

export function useAdminUsers(
  params: { role?: string; status?: string; page?: number; size?: number } = {},
): UseQueryResult<Page<AdminUserSummary>> {
  return useQuery({
    queryKey: adminKeys.users.list(params),
    queryFn: () => adminApi.users.list(params),
    staleTime: 30_000,
  });
}

export function useAdminUser(
  id: string | undefined,
): UseQueryResult<AdminUserDetail> {
  return useQuery({
    queryKey: adminKeys.users.detail(id ?? ''),
    queryFn: () => adminApi.users.get(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/* ===================== User mutations ===================== */

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUserDetail,
    Error,
    { id: string; payload: UpdateUserStatusRequest }
  >({
    mutationFn: ({ id, payload }) => adminApi.users.updateStatus(id, payload),
    onSuccess: (_user, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.detail(id) });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUserDetail,
    Error,
    { id: string; payload: UpdateUserRoleRequest }
  >({
    mutationFn: ({ id, payload }) => adminApi.users.updateRole(id, payload),
    onSuccess: (_user, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.detail(id) });
    },
  });
}

/* ===================== Store queries ===================== */

export function useAdminStores(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Page<AdminStoreSummary>> {
  return useQuery({
    queryKey: adminKeys.stores.list(params),
    queryFn: () => adminApi.stores.list(params),
    staleTime: 30_000,
  });
}

/**
 * Delete a store. Cascades to the store's products on the backend.
 *
 * Invalidation is aggressive because the cascade is broad:
 *   - adminKeys.stores.all      — the deleted store disappears
 *   - productKeys.all           — every product in the store is gone
 *   - sellerKeys.products.all   — the seller's view of their products
 *
 * We do NOT invalidate sellerKeys.orders — historical orders remain
 * valid because the backend keeps order_items rows regardless of
 * product soft-deletes.
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => adminApi.stores.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.stores.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: sellerKeys.products.all });
    },
  });
}

/* ===================== Product mutations ===================== */

/**
 * Toggle the featured flag on a product.
 *
 * Invalidation ripples wide because featured products appear in the
 * buyer's featured rail AND their category listings AND search
 * results — all served by productKeys.
 */
export function useFeatureProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { id: string; featured: boolean }>({
    mutationFn: ({ id, featured }) =>
      featured ? adminApi.products.feature(id) : adminApi.products.unfeature(id),
    onSuccess: (_product, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => adminApi.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: sellerKeys.products.all });
    },
  });
}

/* ===================== Order queries ===================== */

export function useAdminOrders(
  params: { status?: OrderStatus; page?: number; size?: number } = {},
): UseQueryResult<Page<OrderSummary>> {
  return useQuery({
    queryKey: adminKeys.orders.list(params),
    queryFn: () => adminApi.orders.list(params),
    staleTime: 30_000,
  });
}

export function useAdminOrder(
  id: string | undefined,
): UseQueryResult<Order> {
  return useQuery({
    queryKey: adminKeys.orders.detail(id ?? ''),
    queryFn: () => adminApi.orders.get(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * Force an order's status. This bypasses the seller transition rules
 * — the admin can move an order from any state to any other state.
 * Stock and email side-effects: none. The backend's forceStatus just
 * writes the row.
 *
 * Invalidation reaches all three roles:
 *   - adminKeys.orders.*      — the admin list/detail refresh
 *   - orderKeys.*             — the shopper's history and detail
 *   - sellerKeys.orders.*     — the seller's list and detail
 */
export function useForceOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    Error,
    { id: string; payload: AdminUpdateOrderStatusRequest }
  >({
    mutationFn: ({ id, payload }) => adminApi.orders.forceStatus(id, payload),
    onSuccess: (_order, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: sellerKeys.orders.all });
    },
  });
}

/* ===================== Category mutations ===================== */

/**
 * Create a category.
 *
 * After creation, both the admin's category list AND the public
 * category list (used by product filters) need to refresh.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CategoryRequest>({
    mutationFn: (payload) => adminApi.categories.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    Error,
    { id: string; payload: CategoryRequest }
  >({
    mutationFn: ({ id, payload }) => adminApi.categories.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // Products embed categoryName; a rename makes those stale.
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => adminApi.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/* ===================== Seller application mutations ===================== */

export function useAdminApplications(
  params: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page?: number;
    size?: number;
  } = {},
): UseQueryResult<Page<SellerApplicationSummary>> {
  return useQuery({
    queryKey: adminKeys.applications.list(params),
    queryFn: () => adminApi.applications.list(params),
    staleTime: 30_000,
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation<SellerApplicationSummary, Error, string>({
    mutationFn: (id) => adminApi.applications.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.applications.all });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    SellerApplicationSummary,
    Error,
    { id: string; payload: RejectApplicationRequest }
  >({
    mutationFn: ({ id, payload }) =>
      adminApi.applications.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.applications.all });
    },
  });
}

import { api } from '@/lib/api/client';
import type { Page } from '@/lib/api/types';
import type {
  AdminStoreSummary,
  AdminUpdateOrderStatusRequest,
  AdminUserDetail,
  AdminUserSummary,
  Category,
  CategoryRequest,
  Order,
  OrderStatus,
  OrderSummary,
  Product,
  RejectApplicationRequest,
  SellerApplicationSummary,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from './admin.types';

/**
 * Admin API client. Every endpoint requires ROLE_ADMIN — enforced by
 * the backend's @PreAuthorize on each controller. The axios
 * interceptor attaches the JWT automatically.
 *
 * Grouped by resource so call sites read like English:
 *   adminApi.users.updateStatus(id, { status: 'SUSPENDED' })
 *   adminApi.products.feature(id)
 *   adminApi.applications.approve(id)
 */
export const adminApi = {
  /* ===================== Users ===================== */

  users: {
    async list(
      params: {
        role?: string;
        status?: string;
        page?: number;
        size?: number;
      } = {},
    ): Promise<Page<AdminUserSummary>> {
      const query: Record<string, string | number> = {};
      if (params.role) query.role = params.role;
      if (params.status) query.status = params.status;
      if (params.page !== undefined) query.page = params.page;
      if (params.size !== undefined) query.size = params.size;

      const { data } = await api.get<Page<AdminUserSummary>>(
        '/api/admin/users',
        { params: query },
      );
      return data;
    },

    async get(id: string): Promise<AdminUserDetail> {
      const { data } = await api.get<AdminUserDetail>(
        `/api/admin/users/${id}`,
      );
      return data;
    },

    async updateStatus(
      id: string,
      payload: UpdateUserStatusRequest,
    ): Promise<AdminUserDetail> {
      const { data } = await api.patch<AdminUserDetail>(
        `/api/admin/users/${id}/status`,
        payload,
      );
      return data;
    },

    async updateRole(
      id: string,
      payload: UpdateUserRoleRequest,
    ): Promise<AdminUserDetail> {
      const { data } = await api.patch<AdminUserDetail>(
        `/api/admin/users/${id}/role`,
        payload,
      );
      return data;
    },
  },

  /* ===================== Stores ===================== */

  stores: {
    async list(
      params: { page?: number; size?: number } = {},
    ): Promise<Page<AdminStoreSummary>> {
      const query: Record<string, number> = {};
      if (params.page !== undefined) query.page = params.page;
      if (params.size !== undefined) query.size = params.size;

      const { data } = await api.get<Page<AdminStoreSummary>>(
        '/api/admin/stores',
        { params: query },
      );
      return data;
    },

    async get(id: string): Promise<AdminStoreSummary> {
      const { data } = await api.get<AdminStoreSummary>(
        `/api/admin/stores/${id}`,
      );
      return data;
    },

    async delete(id: string): Promise<void> {
      await api.delete(`/api/admin/stores/${id}`);
    },
  },

  /* ===================== Products ===================== */

  products: {
    /**
     * Admin sees ALL products via /api/admin/products. The controller
     * (which we haven't read) is likely similar to the seller's but
     * unfiltered — however, for the feature toggle we only need
     * feature/unfeature, which are always scoped to a single id.
     *
     * For listing, we'll reuse the public product list query — same
     * shape, and admin can filter by anything there. If the admin
     * needs "all products including soft-deleted," we'd hit a
     * different endpoint; not required for the current task.
     */
    async feature(id: string): Promise<Product> {
      const { data } = await api.patch<Product>(
        `/api/admin/products/${id}/feature`,
      );
      return data;
    },

    async unfeature(id: string): Promise<Product> {
      const { data } = await api.patch<Product>(
        `/api/admin/products/${id}/unfeature`,
      );
      return data;
    },

    async delete(id: string): Promise<void> {
      await api.delete(`/api/admin/products/${id}`);
    },
  },

  /* ===================== Orders ===================== */

  orders: {
    async list(
      params: {
        status?: OrderStatus;
        page?: number;
        size?: number;
      } = {},
    ): Promise<Page<OrderSummary>> {
      const query: Record<string, string | number> = {};
      if (params.status) query.status = params.status;
      if (params.page !== undefined) query.page = params.page;
      if (params.size !== undefined) query.size = params.size;

      const { data } = await api.get<Page<OrderSummary>>(
        '/api/admin/orders',
        { params: query },
      );
      return data;
    },

    async get(id: string): Promise<Order> {
      const { data } = await api.get<Order>(`/api/admin/orders/${id}`);
      return data;
    },

    /**
     * Force-set the status. Bypasses the seller transition rules —
     * that's the point of god mode. Backend logs a WARN when used.
     */
    async forceStatus(
      id: string,
      payload: AdminUpdateOrderStatusRequest,
    ): Promise<Order> {
      const { data } = await api.patch<Order>(
        `/api/admin/orders/${id}/status`,
        payload,
      );
      return data;
    },
  },

  /* ===================== Categories ===================== */

  categories: {
    async create(payload: CategoryRequest): Promise<Category> {
      const { data } = await api.post<Category>(
        '/api/admin/categories',
        payload,
      );
      return data;
    },

    async update(id: string, payload: CategoryRequest): Promise<Category> {
      const { data } = await api.patch<Category>(
        `/api/admin/categories/${id}`,
        payload,
      );
      return data;
    },

    async delete(id: string): Promise<void> {
      await api.delete(`/api/admin/categories/${id}`);
    },
  },

  /* ===================== Seller applications ===================== */

  applications: {
    async list(
      params: {
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        page?: number;
        size?: number;
      } = {},
    ): Promise<Page<SellerApplicationSummary>> {
      const query: Record<string, string | number> = {};
      if (params.status) query.status = params.status;
      if (params.page !== undefined) query.page = params.page;
      if (params.size !== undefined) query.size = params.size;

      const { data } = await api.get<Page<SellerApplicationSummary>>(
        '/api/admin/seller-applications',
        { params: query },
      );
      return data;
    },

    /**
     * Approve → backend sends invite email. Returns the updated
     * application with status=APPROVED.
     */
    async approve(id: string): Promise<SellerApplicationSummary> {
      const { data } = await api.post<SellerApplicationSummary>(
        `/api/admin/seller-applications/${id}/approve`,
      );
      return data;
    },

    /**
     * Reject with a reason. Reason appears in the email sent to the
     * applicant.
     */
    async reject(
      id: string,
      payload: RejectApplicationRequest,
    ): Promise<SellerApplicationSummary> {
      const { data } = await api.post<SellerApplicationSummary>(
        `/api/admin/seller-applications/${id}/reject`,
        payload,
      );
      return data;
    },
  },
};

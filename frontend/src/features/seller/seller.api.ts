import { api } from '@/lib/api/client';
import type { Page } from '@/lib/api/types';
import type {
  CreateProductRequest,
  Order,
  OrderSummary,
  Product,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
} from './seller.types';

/**
 * Seller API client.
 *
 * Same design as every other API client in the app: pure Promises,
 * no TanStack Query. The hooks wrap these calls.
 *
 * All endpoints assume the JWT belongs to a SELLER — the backend
 * enforces @PreAuthorize("hasRole('SELLER')") on every path. The
 * axios interceptor attaches the token automatically.
 */
export const sellerApi = {
  /* ===================== Products ===================== */

  /**
   * GET /api/seller/products?page=0&size=20
   * Returns a paginated list of the seller's own products.
   */
  async listProducts(
    params: { page?: number; size?: number } = {},
  ): Promise<Page<Product>> {
    const query: Record<string, number> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.size !== undefined) query.size = params.size;

    const { data } = await api.get<Page<Product>>(
      '/api/seller/products',
      { params: query },
    );
    return data;
  },

  /**
   * POST /api/seller/products
   * Creates a product in the seller's store. Returns 201 with the
   * created product.
   */
  async createProduct(payload: CreateProductRequest): Promise<Product> {
    const { data } = await api.post<Product>(
      '/api/seller/products',
      payload,
    );
    return data;
  },

  /**
   * PATCH /api/seller/products/{id}
   * Partial update — send only the fields you want to change. In
   * the edit form we send everything; see UpdateProductRequest
   * for the semantics discussion.
   */
  async updateProduct(
    id: string,
    payload: UpdateProductRequest,
  ): Promise<Product> {
    const { data } = await api.patch<Product>(
      `/api/seller/products/${id}`,
      payload,
    );
    return data;
  },

  /**
   * DELETE /api/seller/products/{id}
   * Soft-deletes the product. 204 No Content on success. The
   * product remains in the database for order history integrity
   * but disappears from public listings.
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/seller/products/${id}`);
  },

  /* ===================== Orders ===================== */

  /**
   * GET /api/seller/orders?page=0&size=20
   * Lists orders containing at least one of the seller's products.
   * Scoped automatically by the backend from the JWT.
   */
  async listOrders(
    params: { page?: number; size?: number } = {},
  ): Promise<Page<OrderSummary>> {
    const query: Record<string, number> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.size !== undefined) query.size = params.size;

    const { data } = await api.get<Page<OrderSummary>>(
      '/api/seller/orders',
      { params: query },
    );
    return data;
  },

  /**
   * GET /api/seller/orders/{id}
   * Returns the order's full detail, but ONLY the items that belong
   * to the seller. If the order contains items from other stores,
   * those items are filtered out server-side. The seller sees their
   * slice of the order.
   */
  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/api/seller/orders/${id}`);
    return data;
  },

  /**
   * PATCH /api/seller/orders/{id}/status
   * Advances the order to the next valid status. The backend rejects
   * invalid transitions with INVALID_TRANSITION; the frontend only
   * offers the valid step via nextSellerStatus().
   */
  async updateOrderStatus(
    id: string,
    payload: UpdateOrderStatusRequest,
  ): Promise<Order> {
    const { data } = await api.patch<Order>(
      `/api/seller/orders/${id}/status`,
      payload,
    );
    return data;
  },
};

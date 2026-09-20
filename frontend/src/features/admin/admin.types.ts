/**
 * Admin feature types.
 *
 * REUSE FIRST: response shapes for orders, products, and categories
 * are identical to what the buyer/seller features already use. We
 * import and re-export them rather than redeclaring — a second
 * OrderStatus union would eventually drift from the first.
 *
 * This file declares only the shapes the admin feature owns: admin-
 * specific summaries, detail envelopes, and request payloads.
 */

import type { Product } from '@/features/products/product.types';
import type { Category } from '@/features/categories/category.types';
import type {
  Order,
  OrderStatus,
  OrderSummary,
} from '@/features/orders/order.types';

/* ===================== Enums ===================== */

/**
 * UserRole and UserStatus are already defined in features/auth, but
 * those are the "self" view. Admin operates on the full set of
 * possible values, which happens to be identical. We re-export from
 * auth to keep a single source of truth.
 */
export type { UserRole, UserStatus } from '@/features/auth/auth.types';

/* ===================== User shapes ===================== */

/**
 * Row in the admin user list.
 *
 * Note that emailVerifiedAt is a string (ISO timestamp) or null —
 * ACTIVE users have a value, unverified users do not.
 */
export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SHOPPER' | 'SELLER';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt: string | null;
  createdAt: string;
}

/**
 * Full user detail. Extends the summary with updatedAt and store
 * information (present only for SELLER users who have created a
 * store).
 */
export interface AdminUserDetail extends AdminUserSummary {
  updatedAt: string;
  storeId: string | null;
  storeName: string | null;
}

/* ===================== Store shapes ===================== */

export interface AdminStoreSummary {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  productCount: number;
  createdAt: string;
}

/* ===================== Seller application shapes ===================== */

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SellerApplicationSummary {
  id: string;
  name: string;
  email: string;
  shopName: string;
  description: string | null;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

/* ===================== Request payloads ===================== */

/**
 * PATCH /api/admin/users/{id}/status
 * Backend: @Pattern(regexp = "^(ACTIVE|SUSPENDED)$")
 */
export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED';
}

/**
 * PATCH /api/admin/users/{id}/role
 * Backend: @Pattern(regexp = "^(ADMIN|SHOPPER|SELLER)$")
 */
export interface UpdateUserRoleRequest {
  role: 'ADMIN' | 'SHOPPER' | 'SELLER';
}

/**
 * POST /api/admin/seller-applications/{id}/reject
 * Backend: @NotBlank, @Size(max=500)
 */
export interface RejectApplicationRequest {
  reason: string;
}

/**
 * POST and PATCH /api/admin/categories
 * Backend: @NotBlank name, @Size(min=2, max=100); description <=500
 */
export interface CategoryRequest {
  name: string;
  description?: string | null;
}

/**
 * PATCH /api/admin/orders/{id}/status
 * Admin can force any status. Uses the same UpdateOrderStatusRequest
 * shape as the seller endpoint (bare string status).
 */
export interface AdminUpdateOrderStatusRequest {
  status: OrderStatus;
}

/* ===================== Re-exports ===================== */

// Convenience re-exports so admin pages can import everything from
// one place without knowing which feature each type originally
// belongs to.
export type {
  Category,
  Order,
  OrderStatus,
  OrderSummary,
  Product,
};

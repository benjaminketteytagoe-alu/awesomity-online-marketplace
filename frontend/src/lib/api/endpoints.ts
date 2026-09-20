/**
 * Every API path the frontend uses lives here.
 * Components import ENDPOINTS.auth.login — never a raw string.
 *
 * Why: single source of truth for URLs. If the backend renames a route,
 * we change it once. Typos become compile errors, not 404s.
 */
export const ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    verify: '/api/auth/verify',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },
  products: {
    list: '/api/products',
    featured: '/api/products/featured',
    byId: (id: string) => `/api/products/${id}`,
    reviews: (productId: string) => `/api/products/${productId}/reviews`,
    reviewSummary: (productId: string) => `/api/products/${productId}/reviews/summary`,
  },
  categories: {
    list: '/api/categories',
    bySlug: (slug: string) => `/api/categories/${slug}`,
  },
  orders: {
    list: '/api/orders',
    place: '/api/orders',
    byId: (id: string) => `/api/orders/${id}`,
    cancel: (id: string) => `/api/orders/${id}/cancel`,
    pay: (id: string) => `/api/orders/${id}/pay`,
  },
  seller: {
    products: '/api/seller/products',
    productById: (id: string) => `/api/seller/products/${id}`,
    orders: '/api/seller/orders',
    orderById: (id: string) => `/api/seller/orders/${id}`,
    orderStatus: (id: string) => `/api/seller/orders/${id}/status`,
  },
  admin: {
    users: '/api/admin/users',
    userById: (id: string) => `/api/admin/users/${id}`,
    userStatus: (id: string) => `/api/admin/users/${id}/status`,
    userRole: (id: string) => `/api/admin/users/${id}/role`,
    stores: '/api/admin/stores',
    storeById: (id: string) => `/api/admin/stores/${id}`,
    categories: '/api/admin/categories',
    categoryById: (id: string) => `/api/admin/categories/${id}`,
    orders: '/api/admin/orders',
    orderById: (id: string) => `/api/admin/orders/${id}`,
    orderStatus: (id: string) => `/api/admin/orders/${id}/status`,
    sellerApplications: '/api/admin/seller-applications',
    approveApplication: (id: string) => `/api/admin/seller-applications/${id}/approve`,
    rejectApplication: (id: string) => `/api/admin/seller-applications/${id}/reject`,
  },
  sellerApplications: {
    apply: '/api/seller-applications',
    accept: '/api/seller-applications/accept',
  },
} as const;

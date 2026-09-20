/**
 * Product domain types — derived directly from the backend API contract.
 *
 * Verified against live responses:
 *   GET /api/products?page=0&size=20         -> Page<Product>
 *   GET /api/products/{id}                   -> Product
 *   GET /api/products/featured               -> Page<Product>
 *
 * Rule of thumb: every field in this file was observed in a real response
 * before being declared. No guessing.
 */

import type { Page } from '@/lib/api/types';

/**
 * A single product as returned by the API.
 *
 * Note: `storeName`, `categoryName`, and `categorySlug` are denormalized
 * into the product response by the backend. This means a product card can
 * render without extra fetches — a deliberate API design choice that
 * simplifies the frontend but couples the response to store/category
 * presentation. If we later need store details (owner, description),
 * that's a separate fetch.
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;   // backend allows null
  price: number;                // JSON number; BigDecimal serialized
  stock: number;
  featured: boolean;

  // Denormalized store fields
  storeId: string;
  storeName: string;

  // Denormalized category fields
  categoryId: string;
  categoryName: string;
  categorySlug: string;

  // ISO-8601 timestamps from the backend
  createdAt: string;
  updatedAt: string;
}

/**
 * A page of products, matching Spring Data's Page<T> serialization.
 * Aliased here so features/products doesn't need to import from lib/api
 * directly — keeps the dependency direction one-way.
 */
export type ProductPage = Page<Product>;

/**
 * Query parameters accepted by GET /api/products.
 *
 * All optional. The backend defaults to page=0, size=20 when omitted.
 * Spring Data uses 0-indexed pages on the wire; the URL and UI use
 * 1-indexed. The translation happens in useProductFilters, not here.
 */
export interface ProductListParams {
  page?: number;      // 0-indexed for the API
  size?: number;
  category?: string;  // category slug, e.g. "electronics"
  search?: string;    // free-text; backend uses trigram ILIKE
  sort?: string;      // e.g. "price,asc" — Spring's Pageable sort format
  featured?: boolean; // some backends accept this as a filter
}

/**
 * Sort options we expose in the UI. Values must match Spring Data's
 * `field,direction` string format.
 */
export const PRODUCT_SORTS = {
  newest: 'createdAt,desc',
  priceAsc: 'price,asc',
  priceDesc: 'price,desc',
  nameAsc: 'name,asc',
} as const;

export type ProductSortKey = keyof typeof PRODUCT_SORTS;

/**
 * Convenience type for the featured endpoint — it returns a
 * Page<Product>, not a bare array. Verified against the live API.
 */
export type FeaturedProductsPage = Page<Product>;
